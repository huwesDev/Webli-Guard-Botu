const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const db = require('../utils/db');

module.exports = function startWeb(client) {
  const app = express();
  const PORT = process.env.WEB_PORT || 3000;

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(session({
    secret: process.env.SESSION_SECRET || 'guard_secret_x9z',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
  }));

  passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: `${process.env.WEB_URL}/auth/callback`,
    scope: ['identify', 'guilds'],
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));

  passport.serializeUser((u, done) => done(null, u));
  passport.deserializeUser((obj, done) => done(null, obj));

  app.use(passport.initialize());
  app.use(passport.session());

  const auth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/login');
  };

  const isAdmin = async (req, res, next) => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return res.redirect('/');

    let member = guild.members.cache.get(req.user.id);
    if (!member) {
      try {
        member = await guild.members.fetch(req.user.id);
      } catch {
        return res.status(403).render('error', { message: 'Sunucuda üye bulunamadı. Önce sunucuya katılın.' });
      }
    }

    if (!member || !member.permissions.has('Administrator')) {
      return res.status(403).render('error', { message: 'Bu panele erişim için sunucuda Administrator yetkisi gerekiyor.' });
    }
    next();
  };

  app.get('/auth/login', passport.authenticate('discord'));
  app.get('/auth/callback', passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => res.redirect('/dashboard'));
  app.get('/auth/logout', (req, res) => req.logout(() => res.redirect('/')));

  app.get('/', (req, res) => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    res.render('index', { user: req.user || null, guild, client });
  });

  app.get('/dashboard', auth, isAdmin, async (req, res) => {
    const guildId = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);
    const settings = db.getSettings(guildId);
    const whitelist = db.getWhitelist(guildId);
    const backups = db.getBackups(guildId);
    const otorol = db.getOtorol(guildId);
    const logStats = db.getLogStats(guildId);
    const sonCezalar = db.getAllCezalar(guildId, 5);

    const whitelistUsers = await Promise.all(
      whitelist.map(async w => {
        try {
          const u = await client.users.fetch(w.user_id);
          return { ...w, username: u.username, avatar: u.displayAvatarURL({ size: 64 }), tag: u.tag };
        } catch {
          return { ...w, username: 'Bilinmiyor', avatar: null, tag: w.user_id };
        }
      })
    );

    res.render('dashboard', {
      user: req.user,
      guild,
      settings,
      whitelist: whitelistUsers,
      backups,
      otorol,
      logStats,
      sonCezalar,
      saved: req.query.saved || null,
      roles: guild?.roles.cache.sort((a, b) => b.position - a.position).toJSON() || [],
      channels: guild?.channels.cache.filter(c => c.type === 0).toJSON() || [],
    });
  });

  app.post('/dashboard/settings', auth, isAdmin, (req, res) => {
    const guildId = process.env.GUILD_ID;
    const toggles = [
      'guard_rol', 'guard_kanal', 'guard_sunucu', 'guard_emoji',
      'guard_sticker', 'guard_bot', 'guard_webhook', 'guard_everyone',
      'guard_davet', 'guard_hesap_yasi', 'guard_link', 'guard_raid',
      'guard_perm', 'guard_channel_create', 'guard_role_create',
      'guard_spam', 'guard_mention', 'guard_caps', 'guard_slowmode',
      'guard_mass', 'guard_channel_update', 'guard_wordfilter',
    ];
    for (const key of toggles) {
      db.updateSetting(guildId, key, req.body[key] === 'on' ? 1 : 0);
    }
    if (req.body.log_channel)     db.updateSetting(guildId, 'log_channel', req.body.log_channel);
    if (req.body.jail_role)       db.updateSetting(guildId, 'jail_role', req.body.jail_role);
    if (req.body.ceza_tip)        db.updateSetting(guildId, 'ceza_tip', req.body.ceza_tip);
    if (req.body.link_whitelist !== undefined) db.updateSetting(guildId, 'link_whitelist', req.body.link_whitelist || '');
    if (req.body.banned_words   !== undefined) db.updateSetting(guildId, 'banned_words',   req.body.banned_words   || '');
    db.updateSetting(guildId, 'min_account_age', parseInt(req.body.min_account_age) || 0);
    db.updateSetting(guildId, 'raid_threshold',  parseInt(req.body.raid_threshold)  || 5);
    db.updateSetting(guildId, 'raid_interval',   parseInt(req.body.raid_interval)   || 10);
    res.redirect('/dashboard?saved=1');
  });

  app.post('/dashboard/whitelist/add', auth, isAdmin, (req, res) => {
    const { userId } = req.body;
    if (userId?.trim()) db.addWhitelist(process.env.GUILD_ID, userId.trim());
    res.redirect('/dashboard#whitelist');
  });
  app.post('/dashboard/whitelist/remove', auth, isAdmin, (req, res) => {
    const { userId } = req.body;
    if (userId) db.removeWhitelist(process.env.GUILD_ID, userId);
    res.redirect('/dashboard#whitelist');
  });

  app.post('/dashboard/backup/delete', auth, isAdmin, (req, res) => {
    const { id } = req.body;
    const b = db.getBackup(id);
    if (b && b.guild_id === process.env.GUILD_ID) db.deleteBackup(id);
    res.redirect('/dashboard#backup');
  });

  app.get('/logs', auth, isAdmin, (req, res) => {
    const guildId = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);
    const kategori = req.query.kat || null;
    const logs = db.getLogs(guildId, kategori, 200);
    const stats = db.getLogStats(guildId);
    res.render('logs', { user: req.user, guild, logs, stats, kategori });
  });

  app.get('/cezalar', auth, isAdmin, (req, res) => {
    const guildId = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);
    const cezalar = db.getAllCezalar(guildId, 100);
    const settings = db.getSettings(guildId);

    let jailedMembers = [];
    if (settings.jail_role && guild) {
      jailedMembers = guild.members.cache
        .filter(m => m.roles.cache.has(settings.jail_role) && !m.user.bot)
        .map(m => ({
          id: m.user.id,
          tag: m.user.tag,
          avatar: m.user.displayAvatarURL({ size: 64 }),
          joinedAt: m.joinedTimestamp,
        }));
    }
    res.render('cezalar', { user: req.user, guild, cezalar, jailedMembers, settings });
  });

  app.post('/cezalar/delete', auth, isAdmin, (req, res) => {
    const { id } = req.body;
    if (id) db.deleteCeza(parseInt(id));
    res.redirect('/cezalar');
  });

  app.post('/cezalar/unjail', auth, isAdmin, async (req, res) => {
    const { userId } = req.body;
    const guildId = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);
    const settings = db.getSettings(guildId);
    if (userId && guild && settings.jail_role) {
      try {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
          await member.roles.remove(settings.jail_role, '[huw3s Guard] Web panelden jail kaldırıldı').catch(() => {});
        }
      } catch {}
    }
    res.redirect('/cezalar');
  });

  app.get('/dashboard/ceza/:userId', auth, isAdmin, (req, res) => {
    const guildId = process.env.GUILD_ID;
    const gecmis = db.getCezaGecmis(guildId, req.params.userId);
    const guild = client.guilds.cache.get(guildId);
    res.render('ceza', { user: req.user, guild, gecmis, userId: req.params.userId });
  });

  app.get('/members', auth, isAdmin, (req, res) => {
    const guildId = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);
    const whitelist = db.getWhitelist(guildId);
    const wlSet = new Set(whitelist.map(w => w.user_id));
    const members = guild?.members.cache
      .filter(m => !m.user.bot)
      .sort((a, b) => (b.joinedTimestamp || 0) - (a.joinedTimestamp || 0))
      .first(100)
      .map(m => ({
        id: m.user.id,
        tag: m.user.tag,
        avatar: m.user.displayAvatarURL({ size: 64 }),
        joinedAt: m.joinedTimestamp,
        roles: m.roles.cache.filter(r => r.id !== guildId).size,
        isAdmin: m.permissions.has('Administrator'),
        isWhitelisted: wlSet.has(m.user.id),
      })) || [];

    res.render('members', { user: req.user, guild, members });
  });

  app.get('/bans', auth, isAdmin, async (req, res) => {
    const guildId = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);
    let bans = [];
    try {
      const banCol = await guild?.bans.fetch();
      bans = banCol?.map(b => ({
        id: b.user.id,
        tag: b.user.tag,
        avatar: b.user.displayAvatarURL({ size: 64 }),
        reason: b.reason || 'Sebep belirtilmedi',
      })) || [];
    } catch {}
    res.render('bans', { user: req.user, guild, bans });
  });

  app.post('/bans/unban', auth, isAdmin, async (req, res) => {
    const { userId } = req.body;
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (userId && guild) {
      await guild.members.unban(userId.trim(), '[huw3s Guard] Web panelden unban').catch(() => {});
    }
    res.redirect('/bans');
  });

  app.get('/settings', auth, isAdmin, (req, res) => {
    const guildId = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);
    const settings = db.getSettings(guildId);
    const roles = guild?.roles.cache.sort((a, b) => b.position - a.position).toJSON() || [];
    const channels = guild?.channels.cache.filter(c => c.type === 0).toJSON() || [];
    res.render('settings', { user: req.user, guild, settings, roles, channels, saved: req.query.saved || null });
  });

  app.post('/settings', auth, isAdmin, (req, res) => {
    const guildId = process.env.GUILD_ID;
    const toggles = [
      'guard_rol','guard_kanal','guard_sunucu','guard_emoji','guard_sticker',
      'guard_bot','guard_webhook','guard_everyone','guard_davet','guard_hesap_yasi',
      'guard_link','guard_raid','guard_perm','guard_channel_create','guard_role_create',
      'guard_spam','guard_mention','guard_caps','guard_slowmode',
      'guard_mass','guard_channel_update','guard_wordfilter',
    ];
    for (const key of toggles) {
      db.updateSetting(guildId, key, req.body[key] === 'on' ? 1 : 0);
    }
    if (req.body.log_channel)     db.updateSetting(guildId, 'log_channel', req.body.log_channel);
    if (req.body.jail_role)       db.updateSetting(guildId, 'jail_role', req.body.jail_role);
    if (req.body.ceza_tip)        db.updateSetting(guildId, 'ceza_tip', req.body.ceza_tip);
    if (req.body.link_whitelist !== undefined) db.updateSetting(guildId, 'link_whitelist', req.body.link_whitelist || '');
    if (req.body.banned_words   !== undefined) db.updateSetting(guildId, 'banned_words',   req.body.banned_words   || '');
    db.updateSetting(guildId, 'min_account_age', parseInt(req.body.min_account_age) || 0);
    db.updateSetting(guildId, 'raid_threshold', parseInt(req.body.raid_threshold) || 5);
    db.updateSetting(guildId, 'raid_interval', parseInt(req.body.raid_interval) || 10);
    db.updateSetting(guildId, 'slowmode_threshold', parseInt(req.body.slowmode_threshold) || 8);
    db.updateSetting(guildId, 'slowmode_seconds', parseInt(req.body.slowmode_seconds) || 10);
    res.redirect('/settings?saved=1');
  });

  app.post('/api/db-reset', auth, isAdmin, (req, res) => {
    try {
      db.resetDatabase(process.env.GUILD_ID);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/stats', auth, (req, res) => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return res.json({ error: 'Guild not found' });
    const logStats = db.getLogStats(process.env.GUILD_ID);
    res.json({
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size,
      ping: client.ws.ping,
      onlineCount: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
      logStats,
    });
  });

  app.get('/api/logs/recent', auth, isAdmin, (req, res) => {
    const logs = db.getLogs(process.env.GUILD_ID, null, 20);
    res.json(logs);
  });

  app.get('/api/user/:id', auth, isAdmin, async (req, res) => {
    try {
      const u = await client.users.fetch(req.params.id);
      res.json({
        id: u.id,
        username: u.username,
        discriminator: u.discriminator,
        avatar: u.displayAvatarURL({ size: 128 }),
        tag: u.tag,
      });
    } catch {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
  });

  app.listen(PORT, () => console.log(`🌐 Web panel: http://localhost:${PORT}`));
};

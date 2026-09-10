const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { isWhitelisted, addCeza, getSettings, addLog } = require('./db');

async function getAuditUser(guild, type, targetId = null) {
  try {
    await new Promise(r => setTimeout(r, 1000));
    const logs = await guild.fetchAuditLogs({ limit: 1, type });
    const entry = logs.entries.first();
    if (!entry) return null;
    if (targetId && entry.target?.id !== targetId) return null;
    if (Date.now() - entry.createdTimestamp > 5000) return null;
    return entry.executor;
  } catch {
    return null;
  }
}

async function sendLog(guild, settings, embed, kategori = 'guard', meta = {}) {
  if (settings.log_channel) {
    const kanal = guild.channels.cache.get(settings.log_channel);
    if (kanal) kanal.send({ embeds: [embed] }).catch(() => {});
  }

  const title = embed.data.title?.replace(/^[^\w\s]+\s+/, '') || 'Log';
  const desc = embed.data.description || embed.data.fields?.map(f => `${f.name}: ${f.value}`).join(' | ') || '';
  const color = embed.data.color ? '#' + embed.data.color.toString(16).padStart(6, '0') : '#5865f2';

  addLog(
    guild.id,
    kategori,
    title,
    desc.slice(0, 500),
    meta.userId || '',
    meta.userTag || '',
    meta.hedefId || '',
    meta.hedefTag || '',
    color
  );
}

async function punish(guild, user, settings, sebep, tip = null) {
  if (!user) return;
  if (isWhitelisted(guild.id, user.id)) return;
  if (user.id === guild.client.user.id) return;

  const cezaTip = tip || settings.ceza_tip || 'jail';
  addCeza(guild.id, user.id, guild.client.user.id, cezaTip, sebep);

  try {
    if (cezaTip === 'ban') {
      await guild.members.ban(user.id, { reason: `[Guard] ${sebep}`, deleteMessageSeconds: 0 });
    } else if (cezaTip === 'jail' && settings.jail_role) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (member) {
        const roller = member.roles.cache.filter(r => r.id !== guild.id);
        await member.roles.remove(roller).catch(() => {});
        await member.roles.add(settings.jail_role).catch(() => {});
      }
    } else if (cezaTip === 'kick') {
      await guild.members.kick(user.id, `[Guard] ${sebep}`).catch(() => {});
    } else {
      await guild.members.kick(user.id, `[Guard] ${sebep}`).catch(() => {});
    }
  } catch (e) {
    console.error('Ceza hatası:', e.message);
  }
}

const CAT = {
  guard:   { color: 0xe03131, hex: '#e03131', icon: '[ GUARD ]' },
  warn:    { color: 0xf59f00, hex: '#f59f00', icon: '[ UYARI ]' },
  info:    { color: 0x1971c2, hex: '#1971c2', icon: '[ BİLGİ ]' },
  success: { color: 0x2f9e44, hex: '#2f9e44', icon: '[ TAMAM ]' },
  voice:   { color: 0x6741d9, hex: '#6741d9', icon: '[ SES ]' },
  msg:     { color: 0xe8590c, hex: '#e8590c', icon: '[ MESAJ ]' },
  role:    { color: 0x0c8599, hex: '#0c8599', icon: '[ ROL ]' },
  member:  { color: 0x5c7cfa, hex: '#5c7cfa', icon: '[ ÜYE ]' },
  ban:     { color: 0xc92a2a, hex: '#c92a2a', icon: '[ BAN ]' },
  join:    { color: 0x40c057, hex: '#40c057', icon: '[ KATILIM ]' },
  leave:   { color: 0x868e96, hex: '#868e96', icon: '[ AYRILMA ]' },
  perm:    { color: 0x862e9c, hex: '#862e9c', icon: '[ İZİN ]' },
  raid:    { color: 0xc92a2a, hex: '#c92a2a', icon: '[ RAİD ]' },
  link:    { color: 0xe67700, hex: '#e67700', icon: '[ LİNK ]' },
};

function guardEmbed(kategori, baslik, alanlar = [], aciklama = null) {
  const cat = CAT[kategori] || { color: 0x5865f2, hex: '#5865f2', icon: '📋' };
  const embed = new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(`${cat.icon} ${baslik}`)
    .setTimestamp()
    .setFooter({ text: 'huw3s Guard System' });

  if (aciklama) embed.setDescription(aciklama);
  if (alanlar.length) embed.addFields(alanlar);
  embed._guardKategori = kategori;
  return embed;
}

module.exports = { getAuditUser, sendLog, punish, guardEmbed, CAT };

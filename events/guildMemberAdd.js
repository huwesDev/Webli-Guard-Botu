const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getSettings, getOtorol, isWhitelisted } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;
    const settings = getSettings(guild.id);

if (member.user.bot) {
      if (!settings.guard_bot) return;

      await new Promise(r => setTimeout(r, 1500));
      let ekleyen = null;
      try {
        const logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) ekleyen = entry.executor;
      } catch {}

      if (ekleyen && isWhitelisted(guild.id, ekleyen.id)) return;
      await member.kick('[huw3s Guard] Yetkisiz bot ekleme').catch(() => {});

      const embed = guardEmbed('guard', 'Bot Koruması — Yetkisiz Bot Engellendi', [
        { name: '› Bot',     value: `${member.user.tag} \`${member.user.id}\``, inline: true },
        { name: '› Ekleyen', value: ekleyen ? `<@${ekleyen.id}> \`${ekleyen.tag}\`` : 'Bilinmiyor', inline: true },
        { name: '› İşlem',   value: '`Bot sunucudan atıldı`', inline: true },
      ]);
      sendLog(guild, settings, embed, 'guard', { userId: ekleyen?.id, userTag: ekleyen?.tag });
      if (ekleyen) await punish(guild, ekleyen, settings, 'Yetkisiz bot ekleme');
      return;
    }

if (settings.guard_hesap_yasi && settings.min_account_age > 0) {
      const hesapYasiGun = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
      if (hesapYasiGun < settings.min_account_age) {
        await member.kick(`[huw3s Guard] Hesap yaşı yetersiz (${hesapYasiGun} gün)`).catch(() => {});

        const embed = guardEmbed('warn', 'Hesap Yaşı Koruması — Üye Engellendi', [
          { name: '› Kullanıcı',   value: `${member.user.tag} \`${member.user.id}\``,  inline: true },
          { name: '› Hesap Yaşı', value: `\`${hesapYasiGun} gün\``,                   inline: true },
          { name: '› Min. Yaş',   value: `\`${settings.min_account_age} gün\``,        inline: true },
          { name: '› Oluşturma',  value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '› İşlem',      value: '`Kick — Hesap yaşı yetersiz`',               inline: true },
        ]);
        sendLog(guild, settings, embed, 'guard', { userId: member.user.id, userTag: member.user.tag });

        member.send({ embeds: [
          new EmbedBuilder()
            .setColor(0xf59f00)
            .setTitle(`${guild.name} — Sunucuya Giriş Engellendi`)
            .setDescription(`Sunucuya katılmak için hesabınızın en az **${settings.min_account_age} gün** eski olması gerekiyor.\n\n> Hesap yaşınız: **${hesapYasiGun} gün**`)
            .setFooter({ text: 'huw3s Guard System' })
            .setTimestamp(),
        ]}).catch(() => {});
        return;
      }
    }

if (settings.log_channel) {
      const hesapYas = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('〔 KATILIM 〕 Yeni Üye Katıldı')
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .addFields(
          { name: '› Kullanıcı',   value: `<@${member.user.id}> \`${member.user.id}\``, inline: true },
          { name: '› Hesap Yaşı', value: `\`${hesapYas} gün\``,                         inline: true },
          { name: '› Oluşturma',  value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '› Üye Sayısı', value: `\`${guild.memberCount}\``,                    inline: true },
          { name: '› Bot',        value: member.user.bot ? 'Evet' : 'Hayır',            inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'huw3s Guard System' });

      sendLog(guild, settings, embed, 'join', { userId: member.user.id, userTag: member.user.tag });
    }

const otorol = getOtorol(guild.id);
    if (otorol) {
      const rol = guild.roles.cache.get(otorol.rol_id);
      if (rol) member.roles.add(rol).catch(() => {});
    }
  },
};

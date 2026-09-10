const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getSettings } = require('../utils/db');
const { sendLog } = require('../utils/guard');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const guild = member.guild;
    const settings = getSettings(guild.id);
    if (!settings.log_channel) return;

    await new Promise(r => setTimeout(r, 1000));

    try {
      const kickLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
      const entry = kickLogs.entries.first();
      if (entry && entry.target?.id === member.id && Date.now() - entry.createdTimestamp < 5000) {
        if (entry.executor?.id === client.user.id) return;

        const embed = new EmbedBuilder()
          .setColor(0xf59f00)
          .setTitle('〔 ÜYE 〕 Kullanıcı Atıldı')
          .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
          .setThumbnail(member.user.displayAvatarURL({ size: 64 }))
          .addFields(
            { name: '› Kullanıcı', value: `<@${member.user.id}> \`${member.user.id}\``, inline: true },
            { name: '› Atan',      value: `<@${entry.executor.id}> \`${entry.executor.tag}\``, inline: true },
            { name: '› Sebep',     value: entry.reason ? `\`${entry.reason}\`` : '*Belirtilmedi*', inline: false },
          )
          .setTimestamp()
          .setFooter({ text: 'huw3s Guard System' });

        sendLog(guild, settings, embed, 'ban', { userId: member.user.id, userTag: member.user.tag });
        return;
      }
    } catch {}

const joinedAgo = member.joinedTimestamp
      ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
      : 'Bilinmiyor';

    const embed = new EmbedBuilder()
      .setColor(0x868e96)
      .setTitle('〔 AYRILMA 〕 Üye Ayrıldı')
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setThumbnail(member.user.displayAvatarURL({ size: 64 }))
      .addFields(
        { name: '› Kullanıcı', value: `<@${member.user.id}> \`${member.user.id}\``, inline: true },
        { name: '› Katılma',   value: joinedAgo, inline: true },
        { name: '› Roller',    value: member.roles.cache.filter(r => r.id !== guild.id).size > 0
          ? [...member.roles.cache.filter(r => r.id !== guild.id).values()].slice(0, 5).map(r => `<@&${r.id}>`).join(' ')
          : '*Yok*', inline: false },
      )
      .setTimestamp()
      .setFooter({ text: 'huw3s Guard System' });

    sendLog(guild, settings, embed, 'leave', { userId: member.user.id, userTag: member.user.tag });
  },
};

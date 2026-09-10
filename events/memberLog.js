const { AuditLogEvent, Events, EmbedBuilder } = require('discord.js');
const { getSettings } = require('../utils/db');
const { sendLog } = require('../utils/guard');

function mkEmbed(color, title, author, fields = []) {
  const e = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setTimestamp()
    .setFooter({ text: 'huw3s Guard System' });
  if (author) e.setAuthor({ name: author.name, iconURL: author.icon });
  if (fields.length) e.addFields(fields);
  return e;
}

module.exports = [
  {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
      const settings = getSettings(newMember.guild.id);
      if (!settings.log_channel) return;

if (oldMember.nickname !== newMember.nickname) {
        const embed = mkEmbed(0x74c0fc, '〔 ÜYE 〕 Nickname Değişti',
          { name: newMember.user.tag, icon: newMember.user.displayAvatarURL() },
          [
            { name: '› Kullanıcı', value: `<@${newMember.user.id}> \`${newMember.user.id}\``, inline: true },
            { name: '› Eski Nick',  value: oldMember.nickname ? `\`${oldMember.nickname}\`` : '*Yok*', inline: true },
            { name: '› Yeni Nick',  value: newMember.nickname ? `\`${newMember.nickname}\`` : '*Kaldırıldı*', inline: true },
          ]
        );
        sendLog(newMember.guild, settings, embed, 'member', { userId: newMember.user.id, userTag: newMember.user.tag });
      }

const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
      if (addedRoles.size > 0) {
        const embed = mkEmbed(0x00ff88, '〔 ROL 〕 Rol Verildi',
          { name: newMember.user.tag, icon: newMember.user.displayAvatarURL() },
          [
            { name: '› Kullanıcı',    value: `<@${newMember.user.id}>`, inline: true },
            { name: `› Verilen (${addedRoles.size})`, value: [...addedRoles.values()].map(r => `<@&${r.id}>`).join(' '), inline: false },
          ]
        );
        sendLog(newMember.guild, settings, embed, 'role', { userId: newMember.user.id, userTag: newMember.user.tag });
      }

const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
      if (removedRoles.size > 0) {
        const embed = mkEmbed(0xff4466, '〔 ROL 〕 Rol Alındı',
          { name: newMember.user.tag, icon: newMember.user.displayAvatarURL() },
          [
            { name: '› Kullanıcı',   value: `<@${newMember.user.id}>`, inline: true },
            { name: `› Alınan (${removedRoles.size})`, value: [...removedRoles.values()].map(r => `<@&${r.id}>`).join(' '), inline: false },
          ]
        );
        sendLog(newMember.guild, settings, embed, 'role', { userId: newMember.user.id, userTag: newMember.user.tag });
      }
    },
  },
  {
    name: Events.GuildBanAdd,
    async execute(ban, client) {
      const settings = getSettings(ban.guild.id);
      if (!settings.log_channel) return;

      await new Promise(r => setTimeout(r, 1000));
      let executor = null;
      try {
        const logs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBan });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;
      } catch {}

      const embed = mkEmbed(0xc92a2a, '〔 BAN 〕 Kullanıcı Banlandı',
        { name: ban.user.tag, icon: ban.user.displayAvatarURL() },
        [
          { name: '› Kullanıcı', value: `<@${ban.user.id}> \`${ban.user.id}\``, inline: true },
          { name: '› Banlayan',  value: executor ? `<@${executor.id}> \`${executor.tag}\`` : 'Bilinmiyor', inline: true },
          { name: '› Sebep',     value: ban.reason ? `\`${ban.reason}\`` : '*Belirtilmedi*', inline: false },
        ]
      ).setThumbnail(ban.user.displayAvatarURL({ size: 64 }));

      sendLog(ban.guild, settings, embed, 'ban', { userId: ban.user.id, userTag: ban.user.tag });
    },
  },
  {
    name: Events.GuildBanRemove,
    async execute(ban, client) {
      const settings = getSettings(ban.guild.id);
      if (!settings.log_channel) return;

      let executor = null;
      try {
        await new Promise(r => setTimeout(r, 800));
        const logs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;
      } catch {}

      const embed = mkEmbed(0x00ff88, '〔 BAN 〕 Ban Kaldırıldı',
        { name: ban.user.tag, icon: ban.user.displayAvatarURL() },
        [
          { name: '› Kullanıcı', value: `<@${ban.user.id}> \`${ban.user.id}\``, inline: true },
          { name: '› Kaldıran',  value: executor ? `<@${executor.id}>` : 'Bilinmiyor', inline: true },
        ]
      );
      sendLog(ban.guild, settings, embed, 'ban', { userId: ban.user.id, userTag: ban.user.tag });
    },
  },
  {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client) {
      const guild = newState.guild || oldState.guild;
      const settings = getSettings(guild.id);
      if (!settings.log_channel) return;

      const user = newState.member?.user || oldState.member?.user;
      if (!user || user.bot) return;

      if (!oldState.channelId && newState.channelId) {
        const embed = mkEmbed(0x00ff88, '〔 SES 〕 Ses Kanalına Katıldı',
          { name: user.tag, icon: user.displayAvatarURL() },
          [
            { name: '› Kullanıcı', value: `<@${user.id}>`, inline: true },
            { name: '› Kanal',     value: `<#${newState.channelId}>`, inline: true },
          ]
        );
        sendLog(guild, settings, embed, 'voice', { userId: user.id, userTag: user.tag });
      } else if (oldState.channelId && !newState.channelId) {
        const embed = mkEmbed(0x868e96, '〔 SES 〕 Ses Kanalından Ayrıldı',
          { name: user.tag, icon: user.displayAvatarURL() },
          [
            { name: '› Kullanıcı', value: `<@${user.id}>`, inline: true },
            { name: '› Kanal',     value: `<#${oldState.channelId}>`, inline: true },
          ]
        );
        sendLog(guild, settings, embed, 'voice', { userId: user.id, userTag: user.tag });
      } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const embed = mkEmbed(0x74c0fc, '〔 SES 〕 Ses Kanalı Değişti',
          { name: user.tag, icon: user.displayAvatarURL() },
          [
            { name: '› Kullanıcı', value: `<@${user.id}>`,            inline: true },
            { name: '› Eski',      value: `<#${oldState.channelId}>`, inline: true },
            { name: '› Yeni',      value: `<#${newState.channelId}>`, inline: true },
          ]
        );
        sendLog(guild, settings, embed, 'voice', { userId: user.id, userTag: user.tag });
      }
    },
  },
];

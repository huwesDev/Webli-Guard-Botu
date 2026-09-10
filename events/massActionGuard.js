
const { AuditLogEvent } = require('discord.js');
const { getSettings, checkRateLimit, isWhitelisted } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = [
  {
    name: 'guildMemberRemove',
    async execute(member, client) {
      const guild = member.guild;
      const settings = getSettings(guild.id);
      if (!settings.guard_mass) return;

      await new Promise(r => setTimeout(r, 800));
      try {
        const kickLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
        const entry = kickLogs.entries.first();
        if (!entry || Date.now() - entry.createdTimestamp > 4000) return;
        const executor = entry.executor;
        if (!executor || executor.id === client.user.id) return;
        if (isWhitelisted(guild.id, executor.id)) return;

        const isSpam = checkRateLimit(guild.id, executor.id, 'mass_kick', 3, 10);
        if (!isSpam) return;

        const embed = guardEmbed('raid', 'Mass Kick Algılandı — Hesap Ele Geçirilmiş Olabilir', [
          { name: 'Yapan',   value: `${executor.tag} (${executor.id})`, inline: true },
          { name: 'Hedef',   value: `${member.user.tag}`,               inline: true },
          { name: 'İşlem',   value: 'Hesap cezalandırıldı',             inline: true },
        ]);
        sendLog(guild, settings, embed, 'raid', { userId: executor.id, userTag: executor.tag });
        await punish(guild, executor, settings, 'Mass kick — hesap güvenlik ihlali');
      } catch {}
    },
  },
  {
    name: 'guildBanAdd',
    async execute(ban, client) {
      const guild = ban.guild;
      const settings = getSettings(guild.id);
      if (!settings.guard_mass) return;

      await new Promise(r => setTimeout(r, 800));
      try {
        const logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBan });
        const entry = logs.entries.first();
        if (!entry || Date.now() - entry.createdTimestamp > 4000) return;
        const executor = entry.executor;
        if (!executor || executor.id === client.user.id) return;
        if (isWhitelisted(guild.id, executor.id)) return;

        const isSpam = checkRateLimit(guild.id, executor.id, 'mass_ban', 3, 10);
        if (!isSpam) return;

        const embed = guardEmbed('raid', 'Mass Ban Algılandı', [
          { name: 'Yapan', value: `${executor.tag} (${executor.id})`, inline: true },
          { name: 'Hedef', value: `${ban.user.tag}`,                  inline: true },
        ]);
        sendLog(guild, settings, embed, 'raid', { userId: executor.id, userTag: executor.tag });
        await punish(guild, executor, settings, 'Mass ban — hesap güvenlik ihlali');
      } catch {}
    },
  },
];


const { AuditLogEvent } = require('discord.js');
const { getSettings, checkRateLimit, isWhitelisted } = require('../utils/db');
const { getAuditUser, sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'roleCreate',
  async execute(role, client) {
    const guild = role.guild;
    const settings = getSettings(guild.id);
    if (!settings.guard_role_create) return;

    const executor = await getAuditUser(guild, AuditLogEvent.RoleCreate, role.id);
    if (!executor || executor.id === client.user.id) return;
    if (isWhitelisted(guild.id, executor.id)) return;

const isSpam = checkRateLimit(guild.id, executor.id, 'role_create', 3, 10);
    if (!isSpam) return;

    try {
      await role.delete('[Guard] Spam rol oluşturma engellendi');
    } catch {}

    const embed = guardEmbed('guard', 'Rol Spam — Engellendi', [
      { name: '🎭 Rol', value: role.name, inline: true },
      { name: '👤 Oluşturan', value: `${executor.tag} (${executor.id})`, inline: true },
      { name: '↩ İşlem', value: 'Rol silindi, kullanıcı cezalandırıldı', inline: true },
    ]);
    sendLog(guild, settings, embed, 'guard', { userId: executor.id, userTag: executor.tag });
    await punish(guild, executor, settings, 'Rol spam oluşturma');
  },
};

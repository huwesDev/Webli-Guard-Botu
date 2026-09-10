const { AuditLogEvent } = require('discord.js');
const { getSettings } = require('../utils/db');
const { getAuditUser, sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'roleDelete',
  async execute(role, client) {
    const guild = role.guild;
    const settings = getSettings(guild.id);
    if (!settings.guard_rol) return;

    const executor = await getAuditUser(guild, AuditLogEvent.RoleDelete, role.id);
    if (!executor || executor.id === client.user.id) return;

try {
      await guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: role.permissions,
        mentionable: role.mentionable,
        position: role.position,
        reason: '[Guard] Silinen rol geri getirildi',
      });
    } catch {}

    const embed = guardEmbed('guard', 'Rol Silindi — Geri Getirildi', [
      { name: 'Rol', value: role.name, inline: true },
      { name: 'Silen', value: `${executor.tag} (${executor.id})`, inline: true },
      { name: 'İşlem', value: 'Rol geri getirildi', inline: true },
    ]);
    sendLog(guild, settings, embed, 'guard', { userId: executor.id, userTag: executor.tag });

    await punish(guild, executor, settings, 'Rol silme girişimi');
  },
};

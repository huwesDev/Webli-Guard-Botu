
const { AuditLogEvent, PermissionsBitField } = require('discord.js');
const { getSettings } = require('../utils/db');
const { getAuditUser, sendLog, guardEmbed, punish } = require('../utils/guard');

const DANGEROUS = [
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ManageRoles,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.MentionEveryone,
  PermissionsBitField.Flags.ManageWebhooks,
];

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole, client) {
    const guild = newRole.guild;
    const settings = getSettings(guild.id);
    if (!settings.guard_perm) return;

const addedPerms = newRole.permissions.bitfield & ~oldRole.permissions.bitfield;
    const dangerous = DANGEROUS.filter(p => (BigInt(addedPerms) & p) === p);
    if (dangerous.length === 0) return;

    const executor = await getAuditUser(guild, AuditLogEvent.RoleUpdate, newRole.id);
    if (!executor || executor.id === client.user.id) return;

try {
      await newRole.setPermissions(oldRole.permissions, '[Guard] Yetkisiz izin değişikliği geri alındı');
    } catch {}

    const permNames = dangerous.map(p => {
      const key = Object.keys(PermissionsBitField.Flags).find(k => PermissionsBitField.Flags[k] === p);
      return key || p.toString();
    });

    const embed = guardEmbed('perm', 'İzin Koruması — Geri Alındı', [
      { name: '🎭 Rol', value: `${newRole.name} (${newRole.id})`, inline: true },
      { name: '👤 Değiştiren', value: `${executor.tag} (${executor.id})`, inline: true },
      { name: '🔐 Tehlikeli İzinler', value: permNames.join(', '), inline: false },
      { name: '↩ İşlem', value: 'İzinler geri alındı', inline: true },
    ]);
    sendLog(guild, settings, embed, 'guard', { userId: executor.id, userTag: executor.tag });
    await punish(guild, executor, settings, `Rol'e tehlikeli izin ekleme: ${permNames.join(', ')}`);
  },
};

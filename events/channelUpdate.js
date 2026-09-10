
const { AuditLogEvent } = require('discord.js');
const { getSettings } = require('../utils/db');
const { getAuditUser, sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel, client) {
    if (!newChannel.guild) return;
    const guild = newChannel.guild;
    const settings = getSettings(guild.id);
    if (!settings.guard_kanal && !settings.guard_channel_update) return;

    const degisen = [];
    if (oldChannel.name !== newChannel.name)
      degisen.push(`Ad: **${oldChannel.name}** → **${newChannel.name}**`);
    if (oldChannel.topic !== newChannel.topic)
      degisen.push(`Topic değiştirildi`);

    if (!degisen.length) return;

    const executor = await getAuditUser(guild, AuditLogEvent.ChannelUpdate, newChannel.id);
    if (!executor || executor.id === client.user.id) return;

try {
      await newChannel.edit({
        name: oldChannel.name,
        topic: oldChannel.topic,
        reason: '[huw3s Guard] Kanal değişikliği geri alındı',
      });
    } catch {}

    const embed = guardEmbed('guard', 'Kanal Değişikliği — Geri Alındı', [
      { name: 'Kanal',       value: `${newChannel.name} (${newChannel.id})`, inline: true },
      { name: 'Değiştiren',  value: `${executor.tag} (${executor.id})`,      inline: true },
      { name: 'Değişiklik',  value: degisen.join('\n'),                       inline: false },
    ]);
    sendLog(guild, settings, embed, 'guard', { userId: executor.id, userTag: executor.tag });
    await punish(guild, executor, settings, 'Kanal değiştirme girişimi');
  },
};

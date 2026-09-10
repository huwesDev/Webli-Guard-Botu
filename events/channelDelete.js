const { AuditLogEvent } = require('discord.js');
const { getSettings } = require('../utils/db');
const { getAuditUser, sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    if (!channel.guild) return;
    const guild = channel.guild;
    const settings = getSettings(guild.id);
    if (!settings.guard_kanal) return;

    const executor = await getAuditUser(guild, AuditLogEvent.ChannelDelete, channel.id);
    if (!executor || executor.id === client.user.id) return;

try {
      await guild.channels.create({
        name: channel.name,
        type: channel.type,
        parent: channel.parentId,
        topic: channel.topic,
        nsfw: channel.nsfw,
        permissionOverwrites: channel.permissionOverwrites?.cache.map(o => ({
          id: o.id, allow: o.allow, deny: o.deny, type: o.type,
        })),
        reason: '[Guard] Silinen kanal geri getirildi',
      });
    } catch {}

    const embed = guardEmbed('guard', 'Kanal Silindi — Geri Getirildi', [
      { name: 'Kanal', value: channel.name, inline: true },
      { name: 'Silen', value: `${executor.tag} (${executor.id})`, inline: true },
      { name: 'İşlem', value: 'Kanal geri getirildi', inline: true },
    ]);
    sendLog(guild, settings, embed, 'guard', { userId: executor.id, userTag: executor.tag });

    await punish(guild, executor, settings, 'Kanal silme girişimi');
  },
};


const { AuditLogEvent } = require('discord.js');
const { getSettings, checkRateLimit, isWhitelisted } = require('../utils/db');
const { getAuditUser, sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'channelCreate',
  async execute(channel, client) {
    if (!channel.guild) return;
    const guild = channel.guild;
    const settings = getSettings(guild.id);
    if (!settings.guard_channel_create) return;

    const executor = await getAuditUser(guild, AuditLogEvent.ChannelCreate, channel.id);
    if (!executor || executor.id === client.user.id) return;
    if (isWhitelisted(guild.id, executor.id)) return;

const isSpam = checkRateLimit(guild.id, executor.id, 'channel_create', 3, 10);
    if (!isSpam) return;

try {
      await channel.delete('[Guard] Spam kanal oluşturma engellendi');
    } catch {}

    const embed = guardEmbed('guard', 'Kanal Spam — Engellendi', [
      { name: '📌 Kanal', value: channel.name, inline: true },
      { name: '👤 Oluşturan', value: `${executor.tag} (${executor.id})`, inline: true },
      { name: '↩ İşlem', value: 'Kanal silindi, kullanıcı cezalandırıldı', inline: true },
    ]);
    sendLog(guild, settings, embed, 'guard', { userId: executor.id, userTag: executor.tag });
    await punish(guild, executor, settings, 'Kanal spam oluşturma');
  },
};

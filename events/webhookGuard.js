const { AuditLogEvent } = require('discord.js');
const { getSettings } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'webhooksUpdate',
  async execute(channel, client) {
    const guild = channel.guild;
    if (!guild) return;
    const settings = getSettings(guild.id);
    if (!settings.guard_webhook) return;

    await new Promise(r => setTimeout(r, 1000));
    let executor = null;
    let tip = 'değişiklik';
    try {
      for (const type of [AuditLogEvent.WebhookCreate, AuditLogEvent.WebhookDelete, AuditLogEvent.WebhookUpdate]) {
        const logs = await guild.fetchAuditLogs({ limit: 1, type });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) {
          executor = entry.executor;
          tip = type === AuditLogEvent.WebhookCreate ? 'oluşturma' : type === AuditLogEvent.WebhookDelete ? 'silme' : 'güncelleme';
          break;
        }
      }
    } catch {}

    if (!executor || executor.id === client.user.id) return;

try {
      const webhooks = await channel.fetchWebhooks();
      for (const wh of webhooks.values()) {
        if (wh.owner?.id === executor.id) await wh.delete('[Guard] Yetkisiz webhook').catch(() => {});
      }
    } catch {}

    const embed = guardEmbed('#E67E22', 'Webhook Koruması', [
      { name: 'Kanal', value: `${channel.name}`, inline: true },
      { name: 'İşlem Tipi', value: tip, inline: true },
      { name: 'Yapan', value: `${executor.tag} (${executor.id})`, inline: true },
    ]);
    sendLog(guild, settings, embed);
    await punish(guild, executor, settings, `Yetkisiz webhook ${tip}`);
  },
};

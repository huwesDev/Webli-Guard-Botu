const { AuditLogEvent } = require('discord.js');
const { getSettings } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

async function handleSticker(guild, client, tip, sticker, auditType) {
  const settings = getSettings(guild.id);
  if (!settings.guard_sticker) return;

  await new Promise(r => setTimeout(r, 1000));
  let executor = null;
  try {
    const logs = await guild.fetchAuditLogs({ limit: 1, type: auditType });
    const entry = logs.entries.first();
    if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;
  } catch {}

  if (!executor || executor.id === client.user.id) return;

  try {
    if (tip === 'ekle') await sticker.delete('[Guard] Yetkisiz sticker ekleme').catch(() => {});
  } catch {}

  const embed = guardEmbed('#9B59B6', 'Sticker Koruması', [
    { name: '🖼️ Sticker', value: `${sticker.name}`, inline: true },
    { name: '⚙️ İşlem', value: tip, inline: true },
    { name: '👤 Yapan', value: executor ? `${executor.tag}` : 'Bilinmiyor', inline: true },
  ]);
  sendLog(guild, settings, embed);
  if (executor) await punish(guild, executor, settings, `Sticker ${tip} girişimi`);
}

module.exports = [
  {
    name: 'guildStickerCreate',
    async execute(sticker, client) { await handleSticker(sticker.guild, client, 'ekle', sticker, AuditLogEvent.StickerCreate); },
  },
  {
    name: 'guildStickerDelete',
    async execute(sticker, client) { await handleSticker(sticker.guild, client, 'sil', sticker, AuditLogEvent.StickerDelete); },
  },
];

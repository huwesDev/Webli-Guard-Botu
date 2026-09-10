const { AuditLogEvent, Events } = require('discord.js');
const { getSettings } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

async function handleEmoji(guild, client, tip, emoji, auditType) {
  const settings = getSettings(guild.id);
  if (!settings.guard_emoji) return;

  await new Promise(r => setTimeout(r, 1000));
  let executor = null;
  try {
    const logs = await guild.fetchAuditLogs({ limit: 1, type: auditType });
    const entry = logs.entries.first();
    if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;
  } catch {}

  if (!executor || executor.id === client.user.id) return;

try {
    if (tip === 'sil') {
      await guild.emojis.create({ attachment: emoji.imageURL(), name: emoji.name, reason: '[Guard] Emoji geri getirildi' });
    } else if (tip === 'ekle') {
      await emoji.delete('[Guard] Yetkisiz emoji ekleme');
    }
  } catch {}

  const embed = guardEmbed('#9B59B6', 'Emoji Koruması', [
    { name: '😀 Emoji', value: `${emoji.name} (${emoji.id})`, inline: true },
    { name: '⚙️ İşlem', value: tip === 'sil' ? 'Silindi → Geri getirildi' : 'Eklendi → Silindi', inline: true },
    { name: '👤 Yapan', value: executor ? `${executor.tag}` : 'Bilinmiyor', inline: true },
  ]);
  sendLog(guild, settings, embed);
  if (executor) await punish(guild, executor, settings, `Emoji ${tip} girişimi`);
}

module.exports = [
  {
    name: Events.GuildEmojiCreate,
    async execute(emoji, client) { await handleEmoji(emoji.guild, client, 'ekle', emoji, AuditLogEvent.EmojiCreate); },
  },
  {
    name: Events.GuildEmojiDelete,
    async execute(emoji, client) { await handleEmoji(emoji.guild, client, 'sil', emoji, AuditLogEvent.EmojiDelete); },
  },
];

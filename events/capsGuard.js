
const { getSettings, isWhitelisted } = require('../utils/db');
const { sendLog, guardEmbed } = require('../utils/guard');

const MIN_LENGTH   = 8;   
const CAPS_PERCENT = 70;  

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    if (message.member?.permissions.has('Administrator')) return;

    const settings = getSettings(message.guild.id);
    if (!settings.guard_caps) return;
    if (isWhitelisted(message.guild.id, message.author.id)) return;

    const content = message.content;
    if (content.length < MIN_LENGTH) return;

    const letters = content.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
    if (letters.length < MIN_LENGTH) return;

    const upper = letters.replace(/[^A-ZĞÜŞİÖÇ]/g, '');
    const pct   = (upper.length / letters.length) * 100;

    if (pct < CAPS_PERCENT) return;

    await message.delete().catch(() => {});

const embed = guardEmbed('info', 'Caps Koruması — Mesaj Silindi', [
      { name: '👤 Kullanıcı', value: `${message.author.tag}`, inline: true },
      { name: '📊 Büyük Harf', value: `%${pct.toFixed(0)}`, inline: true },
    ]);
    sendLog(message.guild, settings, embed, 'info', { userId: message.author.id, userTag: message.author.tag });
  },
};

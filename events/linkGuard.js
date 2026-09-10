
const { getSettings, isWhitelisted } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

const INVITE_REGEX = /discord(?:\.gg|app\.com\/invite|\.com\/invite)\/[a-zA-Z0-9]+/i;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    if (message.member?.permissions.has('Administrator')) return;

    const settings = getSettings(message.guild.id);
    if (!settings.guard_link) return;
    if (isWhitelisted(message.guild.id, message.author.id)) return;

    const content = message.content;
    let ihlal = null;

    if (INVITE_REGEX.test(content)) {
      ihlal = 'Discord davet linki paylaşımı';
    } else {
      
      const whitelist = (settings.link_whitelist || '').split(',').map(s => s.trim()).filter(Boolean);
      const urls = content.match(URL_REGEX) || [];
      const blocked = urls.filter(url => {
        try {
          const domain = new URL(url).hostname;
          return !whitelist.some(w => domain.includes(w));
        } catch { return false; }
      });
      if (blocked.length > 0) ihlal = `Yetkisiz link: ${blocked[0].slice(0, 80)}`;
    }

    if (!ihlal) return;

    await message.delete().catch(() => {});

    const embed = guardEmbed('link', 'Link Koruması — Mesaj Silindi', [
      { name: '👤 Kullanıcı', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: '📌 Kanal', value: `<#${message.channel.id}>`, inline: true },
      { name: '🔗 İhlal', value: ihlal, inline: false },
    ]);
    sendLog(message.guild, settings, embed, 'link', { userId: message.author.id, userTag: message.author.tag });
    await punish(message.guild, message.author, settings, ihlal);
  },
};

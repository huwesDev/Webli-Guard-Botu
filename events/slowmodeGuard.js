
const { getSettings } = require('../utils/db');
const { sendLog, guardEmbed } = require('../utils/guard');

const chanMap = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;

    const settings = getSettings(message.guild.id);
    if (!settings.guard_slowmode) return;

    const threshold = settings.slowmode_threshold || 8;
    const seconds   = settings.slowmode_seconds   || 10;
    const window    = 5000; 

    const key  = message.channel.id;
    const now  = Date.now();
    const data = chanMap.get(key) || { count: 0, firstTime: now, active: false };

    if (now - data.firstTime > window) {
      data.count     = 0;
      data.firstTime = now;
    }
    data.count++;
    chanMap.set(key, data);

    if (data.count >= threshold && !data.active) {
      data.active = true;
      chanMap.set(key, data);

      try {
        await message.channel.setRateLimitPerUser(seconds, '[huw3s Guard] Otomatik slowmode');
      } catch {}

      const embed = guardEmbed('warn', 'Otomatik Slowmode Aktif', [
        { name: '📌 Kanal',     value: `<#${message.channel.id}>`, inline: true },
        { name: '⏱ Slowmode',   value: `${seconds} saniye`,        inline: true },
        { name: '📊 Mesaj/5s',  value: `${data.count}`,            inline: true },
      ]);
      sendLog(message.guild, settings, embed, 'warn', {});

setTimeout(async () => {
        try { await message.channel.setRateLimitPerUser(0, '[huw3s Guard] Slowmode kaldırıldı'); } catch {}
        const d = chanMap.get(key);
        if (d) { d.active = false; d.count = 0; chanMap.set(key, d); }
      }, 30000);
    }
  },
};

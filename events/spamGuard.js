
const { getSettings, isWhitelisted } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

const spamMap = new Map();

const MAX_MSG     = 6;   
const MAX_CLONE   = 3;   
const WINDOW_MS   = 5000;

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    if (message.member?.permissions.has('Administrator')) return;

    const settings = getSettings(message.guild.id);
    if (!settings.log_channel && !settings.guard_spam) return;
    if (!settings.guard_spam) return;
    if (isWhitelisted(message.guild.id, message.author.id)) return;

    const key  = `${message.guild.id}:${message.author.id}`;
    const now  = Date.now();
    const data = spamMap.get(key) || { count: 0, firstTime: now, lastContent: '', cloneCount: 0 };

if (now - data.firstTime > WINDOW_MS) {
      data.count     = 0;
      data.firstTime = now;
      data.cloneCount = 0;
    }

    data.count++;

if (message.content && message.content === data.lastContent) {
      data.cloneCount++;
    } else {
      data.cloneCount = 1;
    }
    data.lastContent = message.content;
    spamMap.set(key, data);

    const isSpam  = data.count  >= MAX_MSG;
    const isClone = data.cloneCount >= MAX_CLONE;

    if (!isSpam && !isClone) return;

try {
      const msgs = await message.channel.messages.fetch({ limit: 10 });
      const userMsgs = msgs.filter(m => m.author.id === message.author.id);
      await message.channel.bulkDelete(userMsgs, true).catch(() => {});
    } catch {}

    spamMap.delete(key);

    const sebep = isClone ? 'Mesaj klonlama (spam)' : 'Hızlı mesaj spam';
    const embed = guardEmbed('warn', `Spam Koruması — ${sebep}`, [
      { name: '👤 Kullanıcı', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: '📌 Kanal',     value: `<#${message.channel.id}>`,                    inline: true },
      { name: '📊 Mesaj',     value: `${data.count} / ${WINDOW_MS/1000}s`,          inline: true },
    ]);
    sendLog(message.guild, settings, embed, 'warn', { userId: message.author.id, userTag: message.author.tag });
    await punish(message.guild, message.author, settings, sebep);
  },
};

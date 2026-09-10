
const { getSettings, isWhitelisted } = require('../utils/db');
const { sendLog, guardEmbed } = require('../utils/guard');

const DEFAULT_BANNED = ['nigger', 'nigga', 'faggot', 'retard'];

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    
    if (!message.guild) return;
    if (!message.author || message.author.bot) return;

const content = message.content;
    if (!content || !content.trim()) return;

if (message.member?.permissions.has('ManageMessages')) return;

    const settings = getSettings(message.guild.id);

if (!settings.guard_wordfilter) return;

if (isWhitelisted(message.guild.id, message.author.id)) return;

const rawCustom = settings.banned_words;
    const customWords = (rawCustom && rawCustom !== 'null')
      ? rawCustom.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0)
      : [];

    const allBanned = [...DEFAULT_BANNED, ...customWords];
    if (allBanned.length === 0) return;

const lower = content.toLowerCase();
    const found = allBanned.find(w => lower.includes(w));
    if (!found) return;

const deleted = await message.delete().catch(() => false);

const embed = guardEmbed('warn', 'Kelime Filtresi — Mesaj Silindi', [
      { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: 'Kanal',     value: `<#${message.channel.id}>`,                     inline: true },
      { name: 'Yasaklı',   value: `\`${found}\``,                                 inline: true },
      { name: 'Silindi',   value: deleted !== false ? 'Evet' : 'Hayır (yetki yok)', inline: true },
    ]);
    sendLog(message.guild, settings, embed, 'warn', {
      userId:  message.author.id,
      userTag: message.author.tag,
    });
  },
};

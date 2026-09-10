
const { getSettings, isWhitelisted } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

const MAX_MENTIONS = 5; 

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    if (message.member?.permissions.has('Administrator')) return;

    const settings = getSettings(message.guild.id);
    if (!settings.guard_mention) return;
    if (isWhitelisted(message.guild.id, message.author.id)) return;

    const mentionCount =
      message.mentions.users.size +
      message.mentions.roles.size;

    if (mentionCount < MAX_MENTIONS) return;

    await message.delete().catch(() => {});

    const embed = guardEmbed('warn', 'Mention Spam — Engellendi', [
      { name: '👤 Kullanıcı', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: '📌 Kanal',     value: `<#${message.channel.id}>`,                    inline: true },
      { name: '📊 Mention',   value: `${mentionCount} mention`,                      inline: true },
    ]);
    sendLog(message.guild, settings, embed, 'warn', { userId: message.author.id, userTag: message.author.tag });
    await punish(message.guild, message.author, settings, `Mass mention: ${mentionCount} kişi`);
  },
};

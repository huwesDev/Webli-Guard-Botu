const { getSettings } = require('../utils/db');
const { sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    const settings = getSettings(message.guild.id);
    if (!settings.guard_everyone) return;

    const mentionsEveryone = message.mentions.everyone;
    if (!mentionsEveryone) return;

await message.delete().catch(() => {});

    const embed = guardEmbed('#E74C3C', '@everyone/@here Koruması', [
      { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: 'Kanal', value: `${message.channel.name}`, inline: true },
      { name: 'İşlem', value: 'Mesaj silindi + ceza', inline: true },
    ]);
    sendLog(message.guild, settings, embed);
    await punish(message.guild, message.author, settings, '@everyone/@here kullanımı');
  },
};

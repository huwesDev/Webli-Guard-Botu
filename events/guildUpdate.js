const { AuditLogEvent } = require('discord.js');
const { getSettings } = require('../utils/db');
const { getAuditUser, sendLog, guardEmbed, punish } = require('../utils/guard');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild, client) {
    const settings = getSettings(newGuild.id);
    if (!settings.guard_sunucu) return;

    const degisen = [];
    if (oldGuild.name !== newGuild.name) degisen.push(`İsim: **${oldGuild.name}** → **${newGuild.name}**`);
    if (oldGuild.icon !== newGuild.icon) degisen.push('İkon değiştirildi');
    if (oldGuild.banner !== newGuild.banner) degisen.push('Banner değiştirildi');
    if (!degisen.length) return;

    const executor = await getAuditUser(newGuild, AuditLogEvent.GuildUpdate);
    if (!executor || executor.id === client.user.id) return;

try {
      await newGuild.edit({
        name: oldGuild.name,
        icon: oldGuild.icon,
        banner: oldGuild.banner,
        reason: '[Guard] Sunucu değişiklikleri geri alındı',
      });
    } catch {}

    const embed = guardEmbed('#FEE75C', 'Sunucu Koruması', [
      { name: 'Değişiklik', value: degisen.join('\n'), inline: false },
      { name: 'Değiştiren', value: `${executor.tag} (${executor.id})`, inline: true },
      { name: 'İşlem', value: 'Geri alındı', inline: true },
    ]);
    sendLog(newGuild, settings, embed);

    await punish(newGuild, executor, settings, 'Sunucu ayarlarını değiştirme girişimi');
  },
};

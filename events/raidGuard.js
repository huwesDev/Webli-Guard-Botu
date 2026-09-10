
const { VerificationLevel } = require('discord.js');
const { getSettings } = require('../utils/db');
const { sendLog, guardEmbed } = require('../utils/guard');

const joinLog = new Map();

const raidMode = new Map();

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    if (member.user.bot) return;
    const guild = member.guild;
    const settings = getSettings(guild.id);
    if (!settings.guard_raid) return;

    const threshold = settings.raid_threshold || 5;
    const interval  = (settings.raid_interval || 10) * 1000;
    const now = Date.now();

    const times = (joinLog.get(guild.id) || []).filter(t => now - t < interval);
    times.push(now);
    joinLog.set(guild.id, times);

    if (times.length >= threshold && !raidMode.get(guild.id)) {
      raidMode.set(guild.id, true);

let prevLevel = guild.verificationLevel;
      try {
        await guild.edit({ verificationLevel: VerificationLevel.High }, '[Guard] Raid algılandı');
      } catch {}

      const embed = guardEmbed('raid', 'RAİD ALGULANDI — Koruma Aktif', [
        { name: '🚨 Eşik', value: `${threshold} kişi / ${settings.raid_interval || 10} saniye`, inline: true },
        { name: '👥 Tespit', value: `${times.length} katılım`, inline: true },
        { name: '🔒 İşlem', value: 'Doğrulama seviyesi HIGH\'a çıkarıldı', inline: false },
      ]);
      sendLog(guild, settings, embed, 'raid', { userId: member.user.id, userTag: member.user.tag });

setTimeout(async () => {
        try {
          await guild.edit({ verificationLevel: prevLevel }, '[Guard] Raid koruması sona erdi');
        } catch {}
        raidMode.set(guild.id, false);
        joinLog.set(guild.id, []);

        const endEmbed = guardEmbed('success', 'Raid Koruması Sona Erdi', [
          { name: '🔓 İşlem', value: 'Doğrulama seviyesi normale döndürüldü', inline: true },
        ]);
        sendLog(guild, settings, endEmbed, 'raid', {});
      }, 5 * 60 * 1000);
    }
  },
};

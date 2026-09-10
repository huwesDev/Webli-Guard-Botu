const { getSettings } = require('../utils/db');
const { sendLog, guardEmbed } = require('../utils/guard');

const inviteCache = new Map();

module.exports = [
  {
    name: 'clientReady',
    once: true,
    async execute(client) {
      for (const guild of client.guilds.cache.values()) {
        try {
          const invites = await guild.invites.fetch();
          inviteCache.set(guild.id, new Map(invites.map(i => [i.code, i.uses])));
        } catch {}
      }
    },
  },
  {
    name: 'inviteCreate',
    async execute(invite, client) {
      const settings = getSettings(invite.guild.id);
      if (!settings.guard_davet) return;

      const cache = inviteCache.get(invite.guild.id) || new Map();
      cache.set(invite.code, invite.uses || 0);
      inviteCache.set(invite.guild.id, cache);
    },
  },
  {
    name: 'inviteDelete',
    async execute(invite, client) {
      const settings = getSettings(invite.guild.id);
      if (!settings.guard_davet) return;

      const cache = inviteCache.get(invite.guild.id);
      if (cache) cache.delete(invite.code);

const embed = guardEmbed('#3498DB', 'Davet Koruması', [
        { name: '🔗 Silinen Davet', value: `${invite.code}`, inline: true },
        { name: '⚙️ İşlem', value: 'Davet silindi, log kaydedildi', inline: true },
      ]);
      sendLog(invite.guild, settings, embed);
    },
  },
];

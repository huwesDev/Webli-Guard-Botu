const { SlashCommandBuilder, PermissionFlagsBits, ContainerBuilder, MessageFlags } = require('discord.js');
const { getSettings, getLogStats, getAllCezalar, getWhitelist } = require('../utils/db');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');

const GUARD_KEYS = [
  'guard_rol','guard_kanal','guard_channel_update','guard_sunucu','guard_perm',
  'guard_emoji','guard_sticker','guard_bot','guard_webhook','guard_everyone',
  'guard_davet','guard_link','guard_raid','guard_hesap_yasi','guard_mass',
  'guard_channel_create','guard_role_create','guard_spam','guard_mention',
  'guard_caps','guard_slowmode','guard_wordfilter',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('istatistik')
    .setDescription('Sunucu ve guard istatistiklerini göster')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const g       = interaction.guild;
    const guildId = g.id;
    const s       = getSettings(guildId);
    const stats   = getLogStats(guildId);
    const cezalar = getAllCezalar(guildId, 9999);
    const wl      = getWhitelist(guildId);

    const aktif = GUARD_KEYS.filter(k => s[k]).length;
    const bans  = cezalar.filter(c => c.tip === 'ban').length;
    const jails = cezalar.filter(c => c.tip === 'jail').length;
    const kicks = cezalar.filter(c => c.tip === 'kick').length;
    const mutes = cezalar.filter(c => c.tip === 'mute').length;

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        new ContainerBuilder().setAccentColor(COLOR.guard)
          .addTextDisplayComponents(
            txt(`### 📊  huw3s Guard — İstatistikler`),
            txt(`**${g.name}**  •  ${g.memberCount} üye`),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(`**🛡️ Guard**\nAktif Modül: **${aktif}** / ${GUARD_KEYS.length}\nWhitelist: **${wl.length}** kişi\nBot Ping: **${interaction.client.ws.ping}ms**`),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(`**📋 Loglar**\nToplam: **${stats.total}**\nBugün: **${stats.bugun}**\nBu Hafta: **${stats.hafta}**\nGuard Olayı: **${stats.guard}**`),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(`**⚖️ Cezalar**\nBan: **${bans}**  •  Jail: **${jails}**  •  Kick: **${kicks}**  •  Mute: **${mutes}**  •  Toplam: **${cezalar.length}**`),
            txt(`-# ${timestamp()}`),
          ),
      ],
    });
  },
};

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  MessageFlags,
} = require('discord.js');
const { updateSetting } = require('../utils/db');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hesap-yasi')
    .setDescription('Sunucuya katılmak için gereken minimum hesap yaşını ayarla')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(o =>
      o.setName('gun').setDescription('Minimum gün (0 = kapalı)').setRequired(true).setMinValue(0).setMaxValue(365)
    ),

  async execute(interaction) {
    const gun = interaction.options.getInteger('gun');
    updateSetting(interaction.guild.id, 'min_account_age', gun);
    updateSetting(interaction.guild.id, 'guard_hesap_yasi', gun > 0 ? 1 : 0);
    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [
        new ContainerBuilder().setAccentColor(gun > 0 ? COLOR.success : COLOR.muted)
          .addTextDisplayComponents(txt(`### 👶  Hesap Yaşı ${gun > 0 ? 'Aktif' : 'Kapatıldı'}`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(gun > 0
              ? `**Min. Yaş:** ${gun} gün\n**Durum:** ✅ Aktif\n\n${gun} günden genç hesaplar sunucuya katılamaz.`
              : '**Durum:** 🔴 Kapalı\nHesap yaşı kısıtlaması kaldırıldı.'
            ),
            txt(`-# ${timestamp()}`),
          ),
      ],
    });
  },
};

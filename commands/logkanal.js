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
    .setName('log-kanal')
    .setDescription('Guard olaylarının gönderileceği log kanalını ayarla')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true)),

  async execute(interaction) {
    const kanal = interaction.options.getChannel('kanal');
    updateSetting(interaction.guild.id, 'log_channel', kanal.id);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [
        new ContainerBuilder().setAccentColor(COLOR.success)
          .addTextDisplayComponents(txt('### 📋  Log Kanalı Ayarlandı'))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(`**Kanal:** <#${kanal.id}>\n**Yetkili:** ${interaction.user.tag}`),
            txt(`-# Guard olayları artık bu kanala gönderilecek  •  ${timestamp()}`),
          ),
      ],
    });
  },
};

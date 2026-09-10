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
    .setName('jail-rol')
    .setDescription('Guard ceza sistemi için jail rolünü ayarla')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName('rol').setDescription('Jail rolü').setRequired(true)),

  async execute(interaction) {
    const rol = interaction.options.getRole('rol');
    updateSetting(interaction.guild.id, 'jail_role', rol.id);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [
        new ContainerBuilder().setAccentColor(COLOR.success)
          .addTextDisplayComponents(
            txt('### ⛓️  Jail Rolü Ayarlandı'),
            sep(),
            txt(`**Rol:** <@&${rol.id}>\n**Yetki:** ${interaction.user.tag}`),
            txt(`-# Guard ceza sistemi bu rolü kullanacak  •  ${timestamp()}`),
          ),
      ],
    });
  },
};

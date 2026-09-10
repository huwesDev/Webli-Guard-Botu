const { SlashCommandBuilder, PermissionFlagsBits, ContainerBuilder, MessageFlags } = require('discord.js');
const { setOtorol, getOtorol, removeOtorol } = require('../utils/db');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('otorol')
    .setDescription('Otorol yönetimi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('ayarla').setDescription('Otorol ayarla')
      .addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true)))
    .addSubcommand(s => s.setName('kaldir').setDescription('Otorolü kaldır'))
    .addSubcommand(s => s.setName('bilgi').setDescription('Mevcut otorol')),

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'ayarla') {
      const rol = interaction.options.getRole('rol');
      setOtorol(guildId, rol.id);
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.success)
            .addTextDisplayComponents(txt('### ⚙️  Otorol Ayarlandı'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(`**Rol:** <@&${rol.id}>\n**Yetkili:** ${interaction.user.tag}`),
              txt(`-# Sunucuya katılan her üyeye bu rol verilecek  •  ${timestamp()}`),
            ),
        ],
      });
    }

    if (sub === 'kaldir') {
      removeOtorol(guildId);
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.warn)
            .addTextDisplayComponents(
              txt('### ⚙️  Otorol Kaldırıldı'),
              txt(`-# Artık yeni üyelere otomatik rol verilmeyecek  •  ${timestamp()}`),
            ),
        ],
      });
    }

    if (sub === 'bilgi') {
      const otorol = getOtorol(guildId);
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(otorol ? COLOR.brand : COLOR.muted)
            .addTextDisplayComponents(txt('### ⚙️  Otorol Bilgisi'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(otorol
                ? `**Aktif Rol:** <@&${otorol.rol_id}>\nSunucuya katılan her üyeye bu rol verilir.`
                : '> Otorol ayarlanmamış.'
              ),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }
  },
};

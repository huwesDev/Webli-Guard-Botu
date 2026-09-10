const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  MessageFlags,
} = require('discord.js');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');
const { errContainer } = require('./ban');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kilit')
    .setDescription('Kanalı kilitle veya kilidini aç')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(s => s.setName('kapat').setDescription('Kanalı kilitle')
      .addStringOption(o => o.setName('sebep').setDescription('Sebep')))
    .addSubcommand(s => s.setName('ac').setDescription('Kanal kilidini aç')),

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const channel = interaction.channel;
    const sebep   = interaction.options.getString('sebep') || 'Belirtilmedi';
    const everyone = interaction.guild.roles.everyone;

    try {
      if (sub === 'kapat') {
        await channel.permissionOverwrites.edit(everyone,
          { SendMessages: false },
          { reason: `[huw3s Guard] ${sebep}` }
        );

        await interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder().setAccentColor(COLOR.danger)
              .addTextDisplayComponents(
                txt('### 🔒  Kanal Kilitlendi'),
                sep(),
                txt(`**Kanal:** <#${channel.id}>\n**Sebep:** ${sebep}\n**Yetkili:** ${interaction.user.tag}`),
                txt(`-# ${timestamp()}`),
              ),
          ],
        });
      } else {
        await channel.permissionOverwrites.edit(everyone,
          { SendMessages: null },
          { reason: '[huw3s Guard] Kilit kaldırıldı' }
        );

        await interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder().setAccentColor(COLOR.success)
              .addTextDisplayComponents(
                txt('### 🔓  Kanal Açıldı'),
                sep(),
                txt(`**Kanal:** <#${channel.id}>\n**Yetkili:** ${interaction.user.tag}`),
                txt(`-# ${timestamp()}`),
              ),
          ],
        });
      }
    } catch (e) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [errContainer(`Kilit işlemi başarısız: ${e.message}`)],
      });
    }
  },
};

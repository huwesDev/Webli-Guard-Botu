const { SlashCommandBuilder, PermissionFlagsBits, ContainerBuilder, MessageFlags } = require('discord.js');
const { addLog } = require('../utils/db');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');
const { errContainer } = require('./ban');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Kullanıcının banını kaldır')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName('id').setDescription('Kullanıcı ID').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Unban sebebi')),

  async execute(interaction) {
    const userId = interaction.options.getString('id').trim();
    const sebep  = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban)
        return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Bu kullanıcı banlı değil.')] });

      await interaction.guild.members.unban(userId, `[huw3s Guard] ${sebep} | Mod: ${interaction.user.tag}`);
      addLog(interaction.guild.id, 'ban', `Unban: ${ban.user.tag}`, `Sebep: ${sebep}`,
        interaction.user.id, interaction.user.tag, userId, ban.user.tag, '#22c55e');

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.success)
            .addTextDisplayComponents(txt('### ✅  Ban Kaldırıldı'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(`**Kullanıcı:** ${ban.user.tag} \`(${userId})\`\n**Yetkili:** ${interaction.user.tag}\n**Sebep:** ${sebep}`),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    } catch (e) {
      await interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer(`Unban başarısız: ${e.message}`)] });
    }
  },
};

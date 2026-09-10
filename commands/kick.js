const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { addCeza, addLog } = require('../utils/db');
const { COLOR } = require('../utils/cv2');
const { errContainer, dmContainer, modAction } = require('./ban');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kullanıcıyı sunucudan at')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Kick sebebi')),

  async execute(interaction) {
    const user  = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    if (user.id === interaction.user.id)
      return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Kendinizi atamazsınız.')] });

    const member = interaction.guild.members.cache.get(user.id);
    if (!member)
      return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Kullanıcı sunucuda değil.')] });

    try {
      await user.send({ flags: MessageFlags.IsComponentsV2, components: [dmContainer(interaction.guild.name, 'kick', sebep, interaction.user.tag)] }).catch(() => {});
      await member.kick(`[huw3s Guard] ${sebep} | Mod: ${interaction.user.tag}`);
      addCeza(interaction.guild.id, user.id, interaction.user.id, 'kick', sebep);
      addLog(interaction.guild.id, 'ban', `Kick: ${user.tag}`, `Sebep: ${sebep}`, interaction.user.id, interaction.user.tag, user.id, user.tag, '#f59f00');
      await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [modAction('👢  Kullanıcı Atıldı', COLOR.warn, user, interaction.user, sebep)] });
    } catch (e) {
      await interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer(`Kick başarısız: ${e.message}`)] });
    }
  },
};

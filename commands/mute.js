const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const { addCeza, addLog } = require('../utils/db');
const { COLOR, timestamp } = require('../utils/cv2');
const { errContainer, dmContainer, modAction } = require('./ban');

const SURE_LABEL = {
  '60': '1 Dakika', '300': '5 Dakika', '600': '10 Dakika',
  '1800': '30 Dakika', '3600': '1 Saat', '86400': '1 Gün', '604800': '1 Hafta',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Kullanıcıyı sustur (timeout)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sure').setDescription('Süre').setRequired(true).addChoices(
      { name: '1 Dakika',  value: '60' },
      { name: '5 Dakika',  value: '300' },
      { name: '10 Dakika', value: '600' },
      { name: '30 Dakika', value: '1800' },
      { name: '1 Saat',    value: '3600' },
      { name: '1 Gün',     value: '86400' },
      { name: '1 Hafta',   value: '604800' },
    ))
    .addStringOption(o => o.setName('sebep').setDescription('Sebep')),

  async execute(interaction) {
    const user   = interaction.options.getUser('kullanici');
    const sureS  = interaction.options.getString('sure');
    const sure   = parseInt(sureS);
    const sebep  = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member)
      return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Kullanıcı sunucuda değil.')] });
    if (user.id === interaction.user.id)
      return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Kendinizi susturmayamazsınız.')] });

    try {
      await member.timeout(sure * 1000, `[huw3s Guard] ${sebep}`);
      addCeza(interaction.guild.id, user.id, interaction.user.id, 'mute', sebep);
      addLog(interaction.guild.id, 'warn', `Mute: ${user.tag}`, `Süre: ${SURE_LABEL[sureS]} | Sebep: ${sebep}`,
        interaction.user.id, interaction.user.tag, user.id, user.tag, '#f59f00');

      await user.send({
        flags: MessageFlags.IsComponentsV2,
        components: [dmContainer(interaction.guild.name, interaction.guild.iconURL(), 'mute', sebep, interaction.user.tag)],
      }).catch(() => {});

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [modAction('🔇  Kullanıcı Susturuldu', COLOR.warn, user, interaction.user, sebep,
          [['Süre', SURE_LABEL[sureS] || `${sure}s`]])],
      });
    } catch (e) {
      await interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer(`Mute başarısız: ${e.message}`)] });
    }
  },
};

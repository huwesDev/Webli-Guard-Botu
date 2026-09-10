const { SlashCommandBuilder, PermissionFlagsBits, ContainerBuilder, MessageFlags } = require('discord.js');
const { addWhitelist, removeWhitelist, getWhitelist } = require('../utils/db');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Guard whitelist yönetimi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('ekle').setDescription('Whitelist ekle')
      .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true)))
    .addSubcommand(s => s.setName('kaldir').setDescription('Whitelist kaldır')
      .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true)))
    .addSubcommand(s => s.setName('liste').setDescription('Whitelist listesi')),

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'ekle') {
      const user = interaction.options.getUser('kullanici');
      addWhitelist(guildId, user.id);
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.success)
            .addTextDisplayComponents(txt("### ✅  Whitelist'e Eklendi"))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(`**Kullanıcı:** ${user.tag} \`(${user.id})\`\n**Yetkili:** ${interaction.user.tag}`),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }

    if (sub === 'kaldir') {
      const user = interaction.options.getUser('kullanici');
      removeWhitelist(guildId, user.id);
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.warn)
            .addTextDisplayComponents(txt("### 🗑️  Whitelist'ten Kaldırıldı"))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(`**Kullanıcı:** ${user.tag} \`(${user.id})\`\n**Yetkili:** ${interaction.user.tag}`),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }

    if (sub === 'liste') {
      const liste = getWhitelist(guildId);
      const listText = liste.length
        ? liste.map((r, i) => `**${i + 1}.** <@${r.user_id}> \`${r.user_id}\``).join('\n')
        : '> Whitelist boş.';
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.brand)
            .addTextDisplayComponents(txt('### ✅  Whitelist Listesi'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(listText),
              txt(`-# Toplam: ${liste.length} kullanıcı  •  ${timestamp()}`),
            ),
        ],
      });
    }
  },
};

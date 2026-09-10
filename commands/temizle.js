const { SlashCommandBuilder, PermissionFlagsBits, ContainerBuilder, MessageFlags } = require('discord.js');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');
const { errContainer } = require('./ban');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('temizle')
    .setDescription('Kanaldan mesaj temizle')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('miktar').setDescription('Mesaj sayısı (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('kullanici').setDescription('Sadece bu kullanıcının mesajları')),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const miktar = interaction.options.getInteger('miktar');
    const hedef  = interaction.options.getUser('kullanici');

    try {
      let mesajlar = await interaction.channel.messages.fetch({ limit: 100 });
      if (hedef) mesajlar = mesajlar.filter(m => m.author.id === hedef.id).first(miktar);
      else       mesajlar = mesajlar.first(miktar);

      const silinebilir = Array.isArray(mesajlar)
        ? mesajlar.filter(m => Date.now() - m.createdTimestamp < 1209600000)
        : [...mesajlar.values()].filter(m => Date.now() - m.createdTimestamp < 1209600000);

      const deleted = await interaction.channel.bulkDelete(silinebilir, true);

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.success)
            .addTextDisplayComponents(txt('### 🗑️  Mesajlar Temizlendi'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt([
                `**Silinen:** ${deleted.size} mesaj`,
                hedef ? `**Kullanıcı:** ${hedef.tag}` : null,
                `**Kanal:** <#${interaction.channel.id}>`,
              ].filter(Boolean).join('\n')),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    } catch (e) {
      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [errContainer(`Temizleme başarısız: ${e.message}`)] });
    }
  },
};

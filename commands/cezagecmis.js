const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  MessageFlags,
} = require('discord.js');
const { getCezaGecmis } = require('../utils/db');
const { COLOR, sep, txt, timestamp, relTime } = require('../utils/cv2');

const TIP_EMOJI = { ban: '🔨', jail: '⛓', kick: '👢', mute: '🔇', warn: '⚠️' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ceza-gecmis')
    .setDescription('Kullanıcının ceza geçmişini görüntüle')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true)),

  async execute(interaction) {
    const user   = interaction.options.getUser('kullanici');
    const gecmis = getCezaGecmis(interaction.guild.id, user.id);

    const listText = gecmis.length
      ? gecmis.map((c, i) => {
          const emoji = TIP_EMOJI[c.tip] ?? '📋';
          return `**${i + 1}.** ${emoji} \`${c.tip.toUpperCase()}\`  ${c.sebep}\n> ${relTime(c.tarih)}  •  <@${c.mod_id}>`;
        }).join('\n\n')
      : '> Ceza geçmişi temiz. ✅';

    const card = new ContainerBuilder()
      .setAccentColor(gecmis.length ? COLOR.danger : COLOR.success)
      .addTextDisplayComponents(
        txt(`### 📋  Ceza Geçmişi — ${user.tag}`),
        txt(`\`${user.id}\`  •  Toplam **${gecmis.length}** kayıt`),
      )
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(
        txt(listText),
        txt(`-# ${timestamp()}`),
      );

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [card],
    });
  },
};

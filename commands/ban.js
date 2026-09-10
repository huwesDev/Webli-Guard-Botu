const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { addCeza, addLog } = require('../utils/db');
const { COLOR, sep, txt, footer, timestamp } = require('../utils/cv2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kullanıcıyı sunucudan kalıcı olarak yasakla')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('kullanici').setDescription('Banlanacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Ban sebebi'))
    .addIntegerOption(o => o.setName('silme_gun').setDescription('Mesaj silme (gün)').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    const user   = interaction.options.getUser('kullanici');
    const sebep  = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const silGun = interaction.options.getInteger('silme_gun') ?? 0;

    if (user.id === interaction.user.id)
      return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Kendinizi banlayamazsınız.')] });
    if (user.id === interaction.client.user.id)
      return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Botu banlayamazsınız.')] });

    const member = interaction.guild.members.cache.get(user.id);
    if (member && !member.bannable)
      return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Bu kullanıcıyı banlayacak yetkim yok.')] });

    try {
      await user.send({
        flags: MessageFlags.IsComponentsV2,
        components: [dmContainer(interaction.guild.name, interaction.guild.iconURL(), 'ban', sebep, interaction.user.tag)],
      }).catch(() => {});

      await interaction.guild.members.ban(user.id, {
        reason: `[huw3s Guard] ${sebep} | Mod: ${interaction.user.tag}`,
        deleteMessageSeconds: silGun * 86400,
      });

      addCeza(interaction.guild.id, user.id, interaction.user.id, 'ban', sebep);
      addLog(interaction.guild.id, 'ban', `Ban: ${user.tag}`, `Mod: ${interaction.user.tag} | Sebep: ${sebep}`,
        interaction.user.id, interaction.user.tag, user.id, user.tag, '#ef4444');

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [modAction('🔨  Kullanıcı Banlandı', COLOR.danger,
          user, interaction.user, sebep,
          [['Mesaj Silme', silGun > 0 ? `${silGun} gün` : 'Yok']]
        )],
      });
    } catch (e) {
      await interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer(`Ban başarısız: ${e.message}`)] });
    }
  },
};

function errContainer(msg) {
  return new ContainerBuilder().setAccentColor(COLOR.danger)
    .addTextDisplayComponents(txt(`### ❌  Hata\n> ${msg}`));
}

function dmContainer(guildName, guildIcon, tip, sebep, mod) {
  const titles = { ban: '🔨 Yasaklandınız', kick: '👢 Atıldınız', mute: '🔇 Susturuldunuz' };
  return new ContainerBuilder().setAccentColor(COLOR.danger)
    .addTextDisplayComponents(
      txt(`### ${titles[tip] || '⚠️ Ceza Aldınız'}`),
      txt(`**Sunucu:** ${guildName}\n**Sebep:** ${sebep}\n**Yetkili:** ${mod}`),
      txt(`-# ${timestamp()}`),
    );
}

function modAction(title, color, target, mod, sebep, extra = []) {
  const fields = [
    `**Kullanıcı:** ${target.tag} \`(${target.id})\``,
    `**Yetkili:** ${mod.tag}`,
    `**Sebep:** ${sebep}`,
    ...extra.map(([k, v]) => `**${k}:** ${v}`),
  ].join('\n');

  return new ContainerBuilder().setAccentColor(color)
    .addTextDisplayComponents(
      txt(`### ${title}`),
      sep(),
      txt(fields),
      txt(`-# ${timestamp()}`),
    );
}

module.exports.dmContainer  = dmContainer;
module.exports.errContainer = errContainer;
module.exports.modAction    = modAction;

const { SlashCommandBuilder, PermissionFlagsBits, ContainerBuilder, MessageFlags } = require('discord.js');
const { addUyari, getUyarilar, getUyariSayisi } = require('../utils/db');
const { COLOR, sep, txt, timestamp, relTime } = require('../utils/cv2');
const { errContainer } = require('./ban');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyari')
    .setDescription('Uyarı yönetimi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName('ver').setDescription('Kullanıcıya uyarı ver')
      .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
      .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(true)))
    .addSubcommand(s => s.setName('liste').setDescription("Kullanıcının uyarılarını gör")
      .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))),

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'ver') {
      const user  = interaction.options.getUser('kullanici');
      const sebep = interaction.options.getString('sebep');
      addUyari(guildId, user.id, interaction.user.id, sebep);
      const toplam = getUyariSayisi(guildId, user.id);

      user.send({
        flags: MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.warn)
            .addTextDisplayComponents(txt(`### ⚠️  ${interaction.guild.name} — Uyarı Aldınız`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(`**Sebep:** ${sebep}\n**Yetkili:** ${interaction.user.tag}\n**Toplam Uyarı:** ${toplam}`),
              txt(`-# ${timestamp()}`),
            ),
        ],
      }).catch(() => {});

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.warn)
            .addTextDisplayComponents(txt('### ⚠️  Uyarı Verildi'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(`**Kullanıcı:** ${user.tag} \`(${user.id})\`\n**Sebep:** ${sebep}\n**Toplam Uyarı:** ${toplam}\n**Yetkili:** ${interaction.user.tag}`),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }

    if (sub === 'liste') {
      const user    = interaction.options.getUser('kullanici');
      const uyarlar = getUyarilar(guildId, user.id);
      const listText = uyarlar.length
        ? uyarlar.map((u, i) => `**${i + 1}.** ${u.sebep}\n> ${relTime(u.tarih)}  •  <@${u.mod_id}>`).join('\n\n')
        : '> Uyarı geçmişi temiz.';

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.info)
            .addTextDisplayComponents(txt(`### 📋  Uyarı Listesi — ${user.tag}`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(listText),
              txt(`-# Toplam: ${uyarlar.length} uyarı  •  ${timestamp()}`),
            ),
        ],
      });
    }
  },
};

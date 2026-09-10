const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const { saveBackup, getBackups, getBackup, deleteBackup } = require('../utils/db');
const { COLOR, sep, txt, timestamp, relTime } = require('../utils/cv2');
const { errContainer } = require('./ban');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Sunucu yedeği yönetimi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('create').setDescription('Yeni yedek oluştur')
      .addStringOption(o => o.setName('isim').setDescription('Yedek ismi').setRequired(true)))
    .addSubcommand(s => s.setName('liste').setDescription('Yedek listesi'))
    .addSubcommand(s => s.setName('yukle').setDescription('Yedek yükle')
      .addStringOption(o => o.setName('id').setDescription('Yedek ID').setRequired(true)))
    .addSubcommand(s => s.setName('delete').setDescription('Yedek sil')
      .addStringOption(o => o.setName('id').setDescription('Yedek ID').setRequired(true))),

  async execute(interaction) {
    const sub   = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'create') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const isim = interaction.options.getString('isim');

      const roller = guild.roles.cache.filter(r => r.id !== guild.id).map(r => ({
        name: r.name, color: r.color, hoist: r.hoist,
        permissions: r.permissions.bitfield.toString(),
        mentionable: r.mentionable, position: r.position,
      }));
      const kanallar = guild.channels.cache.map(c => ({
        id: c.id, name: c.name, type: c.type,
        parentId: c.parentId, position: c.position, topic: c.topic || null,
      }));

      const id = require('crypto').randomBytes(4).toString('hex');
      saveBackup(id, guild.id, isim, { roller, kanallar, tarih: Date.now() });

      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.success)
            .addTextDisplayComponents(
              txt('### 📦  Yedek Oluşturuldu'),
              sep(),
              txt([
                `**İsim:** ${isim}`,
                `**ID:** \`${id}\``,
                `**Rol:** ${roller.length}`,
                `**Kanal:** ${kanallar.length}`,
              ].join('\n')),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }

    if (sub === 'liste') {
      const yedekler = getBackups(guild.id);
      const listText = yedekler.length
        ? yedekler.map((b, i) =>
            `**${i + 1}.** \`${b.id}\`  —  **${b.isim}**\n> <t:${Math.floor(b.tarih / 1000)}:D>  ${relTime(b.tarih)}`
          ).join('\n\n')
        : '> Henüz yedek oluşturulmamış.';

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.brand)
            .addTextDisplayComponents(
              txt(`### 📦  Yedek Listesi`),
              txt(`Toplam **${yedekler.length}** yedek`),
              sep(),
              txt(listText),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }

    if (sub === 'delete') {
      const id    = interaction.options.getString('id');
      const yedek = getBackup(id);
      if (!yedek || yedek.guild_id !== guild.id)
        return interaction.reply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [errContainer('Yedek bulunamadı.')] });

      deleteBackup(id);
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.warn)
            .addTextDisplayComponents(
              txt('### 🗑️  Yedek Silindi'),
              txt(`\`${id}\` — **${yedek.isim}**`),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }

    if (sub === 'yukle') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const id    = interaction.options.getString('id');
      const yedek = getBackup(id);
      if (!yedek || yedek.guild_id !== guild.id)
        return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [errContainer('Yedek bulunamadı.')] });

      const { roller, kanallar } = yedek.veri;
      let rOk = 0, rErr = 0, kOk = 0, kErr = 0;

      for (const r of [...roller].sort((a, b) => a.position - b.position)) {
        if (guild.roles.cache.find(gr => gr.name === r.name)) continue;
        try {
          await guild.roles.create({ name: r.name, color: r.color, hoist: r.hoist, mentionable: r.mentionable, permissions: BigInt(r.permissions), reason: '[Guard] Backup' });
          rOk++;
        } catch { rErr++; }
      }

      const catMap = new Map();
      for (const k of kanallar.filter(c => c.type === ChannelType.GuildCategory)) {
        const mevcut = guild.channels.cache.find(c => c.name === k.name && c.type === ChannelType.GuildCategory);
        if (!mevcut) {
          try {
            const yeni = await guild.channels.create({ name: k.name, type: ChannelType.GuildCategory, reason: '[Guard] Backup' });
            catMap.set(k.name, yeni.id); kOk++;
          } catch { kErr++; }
        } else { catMap.set(k.name, mevcut.id); }
      }

      for (const k of kanallar.filter(c => c.type !== ChannelType.GuildCategory)) {
        if (guild.channels.cache.find(c => c.name === k.name && c.type === k.type)) continue;
        try {
          let parentId = null;
          if (k.parentId) {
            const kat = kanallar.find(c => c.id === k.parentId);
            if (kat) parentId = catMap.get(kat.name) || null;
          }
          await guild.channels.create({ name: k.name, type: k.type, parent: parentId, topic: k.topic || null, reason: '[Guard] Backup' });
          kOk++;
        } catch { kErr++; }
      }

      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.success)
            .addTextDisplayComponents(
              txt('### 📦  Yedek Yüklendi'),
              sep(),
              txt([
                `**Yedek:** ${yedek.isim} \`(${id})\``,
                `**Rol:** ✅ ${rOk}  ❌ ${rErr}`,
                `**Kanal:** ✅ ${kOk}  ❌ ${kErr}`,
              ].join('\n')),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }
  },
};

const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  MessageFlags,
} = require('discord.js');
const { COLOR, sep, txt, timestamp, relTime } = require('../utils/cv2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Kullanıcı hakkında detaylı bilgi')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı (boş = kendin)').setRequired(false)),

  async execute(interaction) {
    const user   = interaction.options.getUser('kullanici') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const hesapGun  = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
    const sunucuGun = member?.joinedTimestamp
      ? Math.floor((Date.now() - member.joinedTimestamp) / 86400000) : null;

    const roller = member
      ? member.roles.cache.filter(r => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position)
      : null;

    const rolStr = roller?.size
      ? roller.first(12).map(r => `<@&${r.id}>`).join(' ') + (roller.size > 12 ? ` +${roller.size - 12}` : '')
      : 'Yok';

    const badges = [
      user.bot                                        && '🤖 Bot',
      member?.permissions.has('Administrator')        && '👑 Admin',
      user.id === interaction.guild.ownerId           && '🏠 Sunucu Sahibi',
    ].filter(Boolean);

    const card = new ContainerBuilder()
      .setAccentColor(member?.displayColor || COLOR.brand)
      .addTextDisplayComponents(
        txt(`### 👤  ${user.tag}`),
        txt(badges.length ? badges.join('  ') : '-# Normal Üye'),
      )
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(
        txt([
          `**ID:** \`${user.id}\``,
          `**Hesap Yaşı:** ${hesapGun} gün  •  <t:${Math.floor(user.createdTimestamp / 1000)}:D>`,
          sunucuGun !== null
            ? `**Sunucuda:** ${sunucuGun} gün  •  <t:${Math.floor(member.joinedTimestamp / 1000)}:D>`
            : null,
          `**Durum:** ${member?.presence?.status ?? 'çevrimdışı'}`,
        ].filter(Boolean).join('\n')),
      )
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(
        txt(`**Roller (${roller?.size ?? 0})**\n${rolStr}`),
        txt(`-# ${timestamp()}`),
      );

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [card],
    });
  },
};

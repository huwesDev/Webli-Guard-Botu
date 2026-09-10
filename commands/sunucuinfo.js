const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');

const VER = ['Yok', 'Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucuinfo')
    .setDescription('Sunucu hakkında detaylı bilgi'),

  async execute(interaction) {
    await interaction.deferReply();
    const g = interaction.guild;
    await g.members.fetch().catch(() => {});

    const bot    = g.members.cache.filter(m => m.user.bot).size;
    const insan  = g.memberCount - bot;
    const text   = g.channels.cache.filter(c => c.type === 0).size;
    const voice  = g.channels.cache.filter(c => c.type === 2).size;
    const cat    = g.channels.cache.filter(c => c.type === 4).size;
    const duyuru = g.channels.cache.filter(c => c.type === 5).size;

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        new ContainerBuilder().setAccentColor(COLOR.brand)
          .addTextDisplayComponents(
            txt(`### 🏠  ${g.name}`),
            txt(`\`${g.id}\`  •  <t:${Math.floor(g.createdTimestamp / 1000)}:D>`),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(`👥 **Üye:** ${g.memberCount} toplam  (${insan} insan, ${bot} bot)\n📌 **Kanal:** ${text} metin  •  ${voice} ses  •  ${duyuru} duyuru  •  ${cat} kategori\n🎭 **Rol:** ${g.roles.cache.size}\n😀 **Emoji:** ${g.emojis.cache.size}`),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(`👑 **Sahip:** <@${g.ownerId}>\n🚀 **Boost:** ${g.premiumSubscriptionCount ?? 0}  •  Seviye ${g.premiumTier}\n🔒 **Doğrulama:** ${VER[g.verificationLevel] ?? g.verificationLevel}\n🌐 **Dil:** ${g.preferredLocale}`),
            txt(`-# ${timestamp()}`),
          ),
      ],
    });
  },
};

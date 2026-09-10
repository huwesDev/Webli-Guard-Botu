const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { getSettings, updateSetting } = require('../utils/db');
const { COLOR } = require('../utils/cv2');

const BANNER = 'https://img.sanishtech.com/u/771c35ec7f3c319cb9dcdfd4f1b52bbe.png';

const PAGES = {
  sunucu: {
    label: '🏰 Sunucu',
    color: COLOR.brand,
    modules: [
      { key: 'guard_rol',            icon: '🎭', label: 'Rol Koruması'     },
      { key: 'guard_kanal',          icon: '📌', label: 'Kanal Koruması'   },
      { key: 'guard_channel_update', icon: '✏️', label: 'Kanal Rename'     },
      { key: 'guard_sunucu',         icon: '🏠', label: 'Sunucu Koruması'  },
      { key: 'guard_perm',           icon: '🔐', label: 'İzin Koruması'    },
      { key: 'guard_emoji',          icon: '😀', label: 'Emoji Koruması'   },
      { key: 'guard_sticker',        icon: '🖼️', label: 'Sticker Koruması' },
    ],
  },
  kullanici: {
    label: '👤 Kullanıcı',
    color: COLOR.danger,
    modules: [
      { key: 'guard_bot',            icon: '🤖', label: 'Bot Koruması'    },
      { key: 'guard_webhook',        icon: '🔗', label: 'Webhook'         },
      { key: 'guard_everyone',       icon: '📢', label: '@everyone'       },
      { key: 'guard_davet',          icon: '💌', label: 'Davet'           },
      { key: 'guard_link',           icon: '🌐', label: 'Link Filtresi'   },
      { key: 'guard_raid',           icon: '🚨', label: 'Raid'            },
      { key: 'guard_hesap_yasi',     icon: '👶', label: 'Hesap Yaşı'      },
      { key: 'guard_mass',           icon: '⚡', label: 'Mass Action'     },
      { key: 'guard_channel_create', icon: '🗂️', label: 'Kanal Spam'      },
      { key: 'guard_role_create',    icon: '🏷️', label: 'Rol Spam'        },
    ],
  },
  mesaj: {
    label: '💬 Mesaj',
    color: COLOR.warn,
    modules: [
      { key: 'guard_spam',       icon: '🛑', label: 'Spam Guard'      },
      { key: 'guard_mention',    icon: '📣', label: 'Mention Guard'   },
      { key: 'guard_caps',       icon: '🔠', label: 'Caps Guard'      },
      { key: 'guard_slowmode',   icon: '🐢', label: 'Auto Slowmode'   },
      { key: 'guard_wordfilter', icon: '🔤', label: 'Kelime Filtresi' },
    ],
  },
};

const PAGE_KEYS = Object.keys(PAGES);

const TOGGLE_MAP = {};
for (const [pageKey, page] of Object.entries(PAGES)) {
  for (const mod of page.modules) {
    const btnId = `guard_tog_${mod.key.replace('guard_', '')}`;
    TOGGLE_MAP[btnId] = { settingKey: mod.key, pageKey };
  }
}

function sep() {
  return new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
}
function txt(content) { return new TextDisplayBuilder().setContent(content); }

function buildPanel(s, guild, activePage = 'sunucu') {
  const page   = PAGES[activePage];
  const mods   = page.modules;
  const totalOn  = Object.values(PAGES).flatMap(p => p.modules).filter(m => s[m.key]).length;
  const totalAll = Object.values(PAGES).flatMap(p => p.modules).length;
  const pageOn   = mods.filter(m => s[m.key]).length;
  const modText  = mods.map(m => `${s[m.key] ? '🟢' : '🔴'} ${m.icon} ${m.label}`).join('\n');

  const card = new ContainerBuilder()
    .setAccentColor(page.color)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        i => i.setURL(BANNER).setDescription('huw3s Guard')
      )
    )
    .addTextDisplayComponents(
      txt(`# 🛡️  Guard Paneli`),
      txt(`**${guild.name}**  •  🟢 ${totalOn} / ${totalAll} aktif`),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      txt(`### ${page.label}  •  ${pageOn}/${mods.length} aktif`),
      txt(modText),
    )
    .addSeparatorComponents(sep());

  for (let i = 0; i < mods.length; i += 5) {
    card.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        mods.slice(i, i + 5).map(m =>
          new ButtonBuilder()
            .setCustomId(`guard_tog_${m.key.replace('guard_', '')}`)
            .setLabel(`${m.icon} ${m.label}`)
            .setStyle(s[m.key] ? ButtonStyle.Success : ButtonStyle.Secondary)
        )
      )
    );
  }

  card.addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        PAGE_KEYS.map(k =>
          new ButtonBuilder()
            .setCustomId(`panel_page_${k}`)
            .setLabel(PAGES[k].label)
            .setStyle(k === activePage ? ButtonStyle.Primary : ButtonStyle.Secondary)
        )
      )
    )
    .addTextDisplayComponents(
      txt(`-# Yeşil = Aktif  •  Gri = Kapalı  •  Değişiklikler anlık uygulanır`)
    );

  return [card];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Guard koruma panelini aç')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const s = getSettings(interaction.guild.id);
    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: buildPanel(s, interaction.guild, 'sunucu'),
    });
  },

  TOGGLE_MAP,
  PAGE_KEYS,
  buildPanel,

  handlePanelButton: async function(interaction) {
    const info = TOGGLE_MAP[interaction.customId];
    if (!info) return false;
    const guildId = interaction.guild.id;
    const s = getSettings(guildId);
    updateSetting(guildId, info.settingKey, s[info.settingKey] ? 0 : 1);
    await interaction.update({ components: buildPanel(getSettings(guildId), interaction.guild, info.pageKey) });
    return true;
  },

  handlePageButton: async function(interaction) {
    const pageKey = interaction.customId.replace('panel_page_', '');
    if (!PAGES[pageKey]) return false;
    await interaction.update({ components: buildPanel(getSettings(interaction.guild.id), interaction.guild, pageKey) });
    return true;
  },
};

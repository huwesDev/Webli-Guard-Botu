const {
  SlashCommandBuilder,
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
const { COLOR } = require('../utils/cv2');

const BANNER = 'https://img.sanishtech.com/u/771c35ec7f3c319cb9dcdfd4f1b52bbe.png';

const CATS = {
  mod: {
    label: '🔨 Moderasyon',
    color: COLOR.danger,
    desc: 'Ban, kick, mute, temizle, kilit, uyarı',
    cmds: [
      ['/ban',          'Kullanıcıyı kalıcı olarak yasaklar.'],
      ['/unban',        'ID ile banı kaldırır.'],
      ['/kick',         'Kullanıcıyı sunucudan atar, DM gönderir.'],
      ['/mute',         'Timeout uygular (1dk – 1 hafta).'],
      ['/uyari ver',    'Uyarı verir, DM ile bildirir.'],
      ['/uyari liste',  'Kullanıcının uyarı geçmişini gösterir.'],
      ['/temizle',      '1–100 mesaj siler, kullanıcıya göre filtreler.'],
      ['/kilit kapat',  'Kanalı kilitler.'],
      ['/kilit ac',     'Kanal kilidini kaldırır.'],
    ],
  },
  guard: {
    label: '🛡️ Guard',
    color: COLOR.guard,
    desc: 'Koruma modülü ve whitelist yönetimi',
    cmds: [
      ['/panel',             '22 guard modülünü panelde yönet.'],
      ['/whitelist ekle',    'Kullanıcıyı guard muafiyetine ekler.'],
      ['/whitelist kaldir',  'Whitelist\'ten çıkarır.'],
      ['/whitelist liste',   'Whitelist\'i listeler.'],
      ['/log-kanal',         'Guard log kanalını ayarlar.'],
      ['/jail-rol',          'Jail rolünü ayarlar.'],
      ['/hesap-yasi',        'Min. hesap yaşını ayarlar.'],
    ],
  },
  info: {
    label: '📊 Bilgi',
    color: COLOR.info,
    desc: 'Sunucu, kullanıcı ve istatistikler',
    cmds: [
      ['/userinfo',    'Kullanıcı detay bilgisi.'],
      ['/sunucuinfo',  'Sunucu istatistikleri.'],
      ['/istatistik',  'Guard ve log özeti.'],
      ['/ceza-gecmis', 'Kullanıcının ceza geçmişi.'],
    ],
  },
  mgmt: {
    label: '⚙️ Yönetim',
    color: COLOR.warn,
    desc: 'Yedek, otorol ve bot yönetimi',
    cmds: [
      ['/backup create',  'Sunucu yapısını yedekler.'],
      ['/backup liste',   'Yedekleri listeler.'],
      ['/backup yukle',   'Yedeği yükler.'],
      ['/backup delete',  'Yedeği siler.'],
      ['/otorol ayarla',  'Otomatik rol ayarlar.'],
      ['/otorol kaldir',  'Otorolü kaldırır.'],
      ['/otorol bilgi',   'Mevcut otorolü gösterir.'],
      ['/db-reset',       '⚠️ Veritabanını sıfırlar (sadece sahip).'],
    ],
  },
};

const TOTAL = Object.values(CATS).reduce((n, c) => n + c.cmds.length, 0);

function sep() {
  return new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
}
function txt(content) { return new TextDisplayBuilder().setContent(content); }

function navRow(activeKey = null) {
  return new ActionRowBuilder().addComponents(
    Object.entries(CATS).map(([k, c]) =>
      new ButtonBuilder()
        .setCustomId(`yardim_btn_${k}`)
        .setLabel(c.label)
        .setStyle(k === activeKey ? ButtonStyle.Primary : ButtonStyle.Secondary)
    )
  );
}

function buildOverview() {
  const catList = Object.values(CATS)
    .map(c => `**${c.label}** — ${c.desc} \`(${c.cmds.length})\``)
    .join('\n');

  const card = new ContainerBuilder()
    .setAccentColor(COLOR.guard)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        i => i.setURL(BANNER).setDescription('huw3s Guard')
      )
    )
    .addTextDisplayComponents(
      txt(`# 📖  Yardım & Komutlar`),
      txt(`Toplam **${TOTAL}** komut  •  **22** guard modülü`),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(catList))
    .addSeparatorComponents(sep())
    .addActionRowComponents(navRow())
    .addTextDisplayComponents(
      txt(`-# Bir kategoriye tıklayın  •  huw3s Guard System`)
    );

  return [card];
}

function buildCategory(key) {
  const cat = CATS[key];
  if (!cat) return buildOverview();

  const cmdText = cat.cmds
    .map(([name, desc]) => `\`${name}\`  —  ${desc}`)
    .join('\n');

  const card = new ContainerBuilder()
    .setAccentColor(cat.color)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        i => i.setURL(BANNER).setDescription('huw3s Guard')
      )
    )
    .addTextDisplayComponents(
      txt(`# ${cat.label}`),
      txt(cat.desc),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(cmdText))
    .addSeparatorComponents(sep())
    .addActionRowComponents(navRow(key))
    .addTextDisplayComponents(
      txt(`-# huw3s Guard System  •  ${cat.cmds.length} komut`)
    );

  return [card];
}

module.exports = {
  CATS,
  buildOverview,
  buildCategory,

  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Tüm komutları ve açıklamalarını listeler'),

  async execute(interaction) {
    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: buildOverview(),
    });
  },
};

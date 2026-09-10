const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { resetDatabase } = require('../utils/db');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db-reset')
    .setDescription('Veritabanını sıfırla — tüm veriler kalıcı olarak silinir')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          new ContainerBuilder().setAccentColor(COLOR.danger)
            .addTextDisplayComponents(
              txt('### ❌  Yetersiz Yetki'),
              txt('Bu komut yalnızca **bot sahibi** tarafından kullanılabilir.'),
              txt(`-# ${timestamp()}`),
            ),
        ],
      });
    }

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('dbreset_confirm').setLabel('Evet, Sıfırla').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('dbreset_cancel').setLabel('İptal').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [
        new ContainerBuilder().setAccentColor(COLOR.warn)
          .addTextDisplayComponents(
            txt('### ⚠️  Veritabanı Sıfırlama'),
            txt('Bu işlem **geri alınamaz.** Aşağıdakiler tamamen silinecek:'),
            sep(),
            txt([
              '📋 Tüm loglar',
              '⛓️ Tüm ceza kayıtları',
              '⚠️ Tüm uyarılar',
              '✅ Whitelist',
              '📦 Yedekler',
              '🔁 Rate limit kayıtları',
              '⚙️ Otorol ayarı',
              '🛡️ Tüm guard ayarları (varsayılana döner)',
            ].join('\n')),
            sep(),
            txt('**Devam etmek istediğinizden emin misiniz?**'),
            txt(`-# 30 saniye içinde yanıtlayın  •  ${timestamp()}`),
          ),
        confirmRow,
      ],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && ['dbreset_confirm', 'dbreset_cancel'].includes(i.customId),
      time: 30000,
      max: 1,
    });

    collector.on('collect', async i => {
      if (i.customId === 'dbreset_cancel') {
        return i.update({
          components: [
            new ContainerBuilder().setAccentColor(COLOR.success)
              .addTextDisplayComponents(
                txt('### ✅  İptal Edildi'),
                txt('Veritabanı sıfırlama işlemi iptal edildi.'),
                txt(`-# ${timestamp()}`),
              ),
          ],
        });
      }

      try {
        resetDatabase(interaction.guild.id);
        await i.update({
          components: [
            new ContainerBuilder().setAccentColor(COLOR.success)
              .addTextDisplayComponents(
                txt('### ✅  Veritabanı Sıfırlandı'),
                sep(),
                txt('Tüm veriler başarıyla silindi. Guard ayarları varsayılan değerlere döndü.'),
                txt(`**Yapan:** <@${interaction.user.id}>`),
                txt(`-# ${timestamp()}`),
              ),
          ],
        });
      } catch (e) {
        await i.update({
          components: [
            new ContainerBuilder().setAccentColor(COLOR.danger)
              .addTextDisplayComponents(
                txt('### ❌  Sıfırlama Başarısız'),
                txt(`\`${e.message}\``),
                txt(`-# ${timestamp()}`),
              ),
          ],
        });
      }
    });

    collector.on('end', (col, reason) => {
      if (reason === 'time' && col.size === 0) {
        interaction.editReply({
          components: [
            new ContainerBuilder().setAccentColor(COLOR.muted)
              .addTextDisplayComponents(
                txt('### ⏱️  Süre Doldu'),
                txt('30 saniye içinde yanıt verilmedi. İşlem iptal edildi.'),
                txt(`-# ${timestamp()}`),
              ),
          ],
        }).catch(() => {});
      }
    });
  },
};

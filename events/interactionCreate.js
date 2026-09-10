const { handlePanelButton, TOGGLE_MAP, handlePageButton } = require('../commands/panel');
const { CATS, buildOverview, buildCategory } = require('../commands/yardim');
const { MessageFlags, ContainerBuilder } = require('discord.js');
const { COLOR, sep, txt, timestamp } = require('../utils/cv2');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, client);
      } catch (e) {
        console.error(`[CMD ERROR] ${interaction.commandName}:`, e);
        const errPayload = {
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [
            new ContainerBuilder().setAccentColor(COLOR.danger)
              .addTextDisplayComponents(
                txt('### ❌  Komut Hatası'),
                sep(),
                txt(`Komut çalıştırılırken bir hata oluştu.\n\`\`\`${e.message?.slice(0, 200) ?? 'Bilinmeyen hata'}\`\`\``),
                txt(`-# ${timestamp()}`),
              ),
          ],
        };
        interaction.replied || interaction.deferred
          ? interaction.followUp(errPayload).catch(() => {})
          : interaction.reply(errPayload).catch(() => {});
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('panel_page_')) {
        return handlePageButton(interaction);
      }

      if (TOGGLE_MAP[interaction.customId]) {
        if (!interaction.member?.permissions.has('Administrator')) {
          return interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [
              new ContainerBuilder().setAccentColor(COLOR.danger)
                .addTextDisplayComponents(txt('### ❌  Bu işlem için Administrator yetkisi gerekiyor.')),
            ],
          });
        }
        return handlePanelButton(interaction);
      }

      if (interaction.customId.startsWith('yardim_btn_')) {
        const key = interaction.customId.replace('yardim_btn_', '');
        if (!CATS[key]) return;
        return interaction.update({ components: buildCategory(key) });
      }

      if (['dbreset_confirm', 'dbreset_cancel'].includes(interaction.customId)) {
        return;
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'yardim_category') {
      const key = interaction.values[0];
      if (!CATS[key]) return;
      return interaction.update({ components: buildCategory(key) });
    }
  },
};

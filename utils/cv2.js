const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const BANNER = 'https://img.sanishtech.com/u/771c35ec7f3c319cb9dcdfd4f1b52bbe.png';

const COLOR = {
  brand:   0x6366f1,
  success: 0x22c55e,
  danger:  0xef4444,
  warn:    0xf59f00,
  info:    0x22d3ee,
  guard:   0x8b5cf6,
  muted:   0x374151,
};

const FLAGS = {
  v2:       MessageFlags.IsComponentsV2,
  v2Eph:    MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  eph:      MessageFlags.Ephemeral,
};

function sep(large = false) {
  return new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small);
}

function txt(content) {
  return new TextDisplayBuilder().setContent(content);
}

function container(accentColor, ...children) {
  const c = new ContainerBuilder().setAccentColor(accentColor);
  for (const child of children) {
    if (!child) continue;
    if (child instanceof TextDisplayBuilder)    { c.addTextDisplayComponents(child); continue; }
    if (child instanceof SeparatorBuilder)      { c.addSeparatorComponents(child);   continue; }
    if (child instanceof ActionRowBuilder)      { c.addActionRowComponents(child);   continue; }
    if (child.constructor?.name?.includes('Section')) { c.addSectionComponents(child); continue; }
  }
  return c;
}

function row(...buttons) {
  return new ActionRowBuilder().addComponents(...buttons);
}

function btn(id, label, style = ButtonStyle.Secondary, emoji = null) {
  const b = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function linkBtn(url, label) {
  return new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(url).setLabel(label);
}

function header(icon, title, subtitle = null) {
  let text = `${icon}  **${title}**`;
  if (subtitle) text += `\n-# ${subtitle}`;
  return txt(text);
}

function footer(text) {
  return txt(`-# ${text} • huw3s Guard`);
}

function timestamp() {
  return `<t:${Math.floor(Date.now() / 1000)}:F>`;
}

function relTime(ms) {
  return `<t:${Math.floor(ms / 1000)}:R>`;
}

module.exports = {
  BANNER,
  COLOR,
  FLAGS,
  sep,
  txt,
  container,
  row,
  btn,
  linkBtn,
  header,
  footer,
  timestamp,
  relTime,
};

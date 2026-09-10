const { AuditLogEvent, Events, EmbedBuilder } = require('discord.js');
const { getSettings } = require('../utils/db');
const { sendLog } = require('../utils/guard');

const msgCache = new Map();
const CACHE_MAX = 500;

function cacheMessage(message) {
  if (!message.guild || message.author?.bot) return;
  const key = `${message.guild.id}:${message.id}`;
  msgCache.set(key, {
    authorId:   message.author?.id,
    authorTag:  message.author?.tag,
    authorAvatar: message.author?.displayAvatarURL?.() || null,
    content:    message.content || '',
    attachments: [...(message.attachments?.values() || [])].map(a => ({
      name: a.name,
      url:  a.url,
      proxyUrl: a.proxyURL,
      contentType: a.contentType || '',
      size: a.size,
    })),
    channelId:  message.channel?.id,
    channelName: message.channel?.name,
    createdAt:  message.createdTimestamp,
  });

if (msgCache.size > CACHE_MAX) {
    const firstKey = msgCache.keys().next().value;
    msgCache.delete(firstKey);
  }
}

module.exports = [
  
  {
    name: Events.MessageCreate,
    async execute(message, client) {
      cacheMessage(message);
    },
  },

{
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage, client) {
      if (!newMessage.guild || newMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;

      const settings = getSettings(newMessage.guild.id);
      if (!settings.log_channel) return;

      const embed = new EmbedBuilder()
        .setColor(0xffa94d)
        .setAuthor({
          name: `${newMessage.author.tag}`,
          iconURL: newMessage.author.displayAvatarURL(),
        })
        .setTitle('〔 MESAJ 〕 Mesaj Düzenlendi')
        .addFields(
          { name: '› Kullanıcı', value: `<@${newMessage.author.id}> \`${newMessage.author.id}\``, inline: true },
          { name: '› Kanal',     value: `<#${newMessage.channel.id}>`, inline: true },
          { name: '› Link',      value: `[Mesaja git](${newMessage.url})`, inline: true },
          { name: '› Eski İçerik', value: `\`\`\`${(oldMessage.content || '*boş*').slice(0, 500)}\`\`\`` },
          { name: '› Yeni İçerik', value: `\`\`\`${(newMessage.content || '*boş*').slice(0, 500)}\`\`\`` },
        )
        .setFooter({ text: `Mesaj ID: ${newMessage.id}` })
        .setTimestamp();

      sendLog(newMessage.guild, settings, embed, 'msg', {
        userId: newMessage.author.id,
        userTag: newMessage.author.tag,
      });
    },
  },

{
    name: Events.MessageDelete,
    async execute(message, client) {
      if (!message.guild) return;

      const settings = getSettings(message.guild.id);
      if (!settings.log_channel) return;

const cached = msgCache.get(`${message.guild.id}:${message.id}`);
      const author = cached || message.author;
      if (author?.bot === true) return;

      const authorTag    = cached?.authorTag    || message.author?.tag    || 'Bilinmiyor';
      const authorId     = cached?.authorId     || message.author?.id     || '?';
      const authorAvatar = cached?.authorAvatar || message.author?.displayAvatarURL?.() || null;
      const content      = cached?.content      || message.content        || '';
      const attachments  = cached?.attachments  || [...(message.attachments?.values() || [])].map(a => ({ name: a.name, url: a.url, contentType: a.contentType || '' }));
      const channelId    = cached?.channelId    || message.channel?.id;

      const isImageOnly = !content && attachments.length > 0;
      const hasImage    = attachments.some(a => a.contentType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(a.name || ''));

      const embed = new EmbedBuilder()
        .setColor(0xff4466)
        .setTitle('〔 MESAJ 〕 Mesaj Silindi')
        .setTimestamp()
        .setFooter({ text: `Mesaj ID: ${message.id} • Kanal: #${cached?.channelName || '?'}` });

      if (authorAvatar) embed.setAuthor({ name: authorTag, iconURL: authorAvatar });
      else embed.setAuthor({ name: authorTag });

      embed.addFields(
        { name: '› Kullanıcı', value: `<@${authorId}> \`${authorId}\``, inline: true },
        { name: '› Kanal',     value: channelId ? `<#${channelId}>` : '?', inline: true },
        { name: '› Gönderilme', value: cached?.createdAt ? `<t:${Math.floor(cached.createdAt / 1000)}:R>` : 'Bilinmiyor', inline: true },
      );

      if (content) {
        embed.addFields({ name: '› Mesaj İçeriği', value: `\`\`\`${content.slice(0, 900)}\`\`\`` });
      }

      if (attachments.length > 0) {
        const attStr = attachments.map(a => `• [${a.name || 'Dosya'}](${a.url})`).join('\n');
        embed.addFields({ name: `› Ekler (${attachments.length})`, value: attStr.slice(0, 900) });

const img = attachments.find(a =>
          a.contentType?.startsWith('image/') ||
          /\.(png|jpg|jpeg|gif|webp)$/i.test(a.name || '')
        );
        if (img) embed.setImage(img.url);
      }

      if (!content && !attachments.length) {
        embed.addFields({ name: '› İçerik', value: '*Mesaj içeriği bilinmiyor (önbellek dışı)*' });
      }

      sendLog(message.guild, settings, embed, 'msg', {
        userId:  authorId,
        userTag: authorTag,
      });

msgCache.delete(`${message.guild.id}:${message.id}`);
    },
  },
];

const { REST, Routes, ActivityType } = require('discord.js');
const fs   = require('fs');
const path = require('path');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} aktif!`);

    client.user.setPresence({
      activities: [{ name: '🛡️ huw3s Guard', type: ActivityType.Watching }],
      status: 'online',
    });

    const commands      = [];
    const commandsPath  = path.join(__dirname, '..', 'commands');

    for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
      try {
        const cmd = require(path.join(commandsPath, file));
        if (cmd?.data) commands.push(cmd.data.toJSON());
      } catch (e) {
        console.error(`[CMD LOAD] ${file}:`, e.message);
      }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ ${commands.length} slash komutu kaydedildi.`);
    } catch (e) {
      console.error('Slash komut kayıt hatası:', e.message);
    }
  },
};

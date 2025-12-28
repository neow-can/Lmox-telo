const { ActivityType, REST, Routes } = require('discord.js');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        client.user.setStatus('Online');
        client.user.setActivity('˗ˋˏ lmox 𝘛𝘦𝘭𝘭𝘰𝘯𝘺𝘮 ˎˊ˗', {
            type: ActivityType.Streaming,
            url: 'pute your link here'
        });

        console.log(`🤖 System Bot is now online!`);
        console.log(`📊 Serving ${client.guilds.cache.size} servers`);
        console.log(`👥 Serving ${client.users.cache.size} users`);

        // Register commands
        const commands = [];
        client.commands.forEach(command => {
            commands.push(command.data.toJSON());
        });

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    },
};
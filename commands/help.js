const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display help information for the Tellonym bot'),
    async execute(interaction) {
        const config = getConfig();
        
        const helpEmbed = new EmbedBuilder()
            .setColor(0xff4081)
            .setTitle('📬 Tellonym Bot Help')
            .setDescription('Anonymous messaging bot for Discord')
            .addFields(
                {
                    name: '📝 Sending Messages',
                    value: 'Use `/tellonym` to send an anonymous message to another user.\n' +
                          'You can choose from 4 message types: Question, Compliment, Advice, or Confession.',
                    inline: false
                },
                {
                    name: '💬 Adding Comments',
                    value: 'Click the "Add Comment" button on any Tellonym message to add your comment.\n' +
                          'You can choose to comment anonymously or with your identity shown.',
                    inline: false
                },
                {
                    name: '↩️ Replying',
                    value: 'Only the recipient of a message can reply to it using the "Reply" button.\n' +
                          'Replies are sent anonymously to the original sender.',
                    inline: false
                },
                {
                    name: '🎛️ Admin Commands',
                    value: '`/setlogs` - Set log channels\n' +
                          '`/setshowtellonym` - Enable/disable Tellonym\n' +
                          '`/tellonymban` - Ban/unban users\n' +
                          '`/ratelimit` - Configure rate limits\n' +
                          '`/msgstats` - View message statistics\n' +
                          '`/ratestats` - View rate limit stats\n' +
                          '`/resetstats` - Reset statistics\n' +
                          '`/showconfig` - Show current configuration',
                    inline: false
                },
                {
                    name: '🛡️ Privacy & Security',
                    value: '• All messages are sent anonymously\n' +
                          '• Comments can be anonymous or identified\n' +
                          '• Rate limiting prevents spam\n' +
                          '• Admin logs track all activity',
                    inline: false
                }
            )
            .setFooter({ text: 'Anonymous Messaging Bot' })
            .setTimestamp();

        if (config.logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                helpEmbed.addFields({
                    name: '📍 Current Log Channel',
                    value: `<#${logChannel.id}>`,
                    inline: true
                });
            }
        }

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    },
};
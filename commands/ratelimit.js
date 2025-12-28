const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig, setConfig } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ratelimit')
        .setDescription('Configure rate limiting for anonymous messages')
        .addIntegerOption(option =>
            option.setName('messages')
                .setDescription('Number of messages allowed per minute (0 to disable)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('window')
                .setDescription('Time window in minutes')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const messageLimit = interaction.options.getInteger('messages');
        const timeWindow = interaction.options.getInteger('window') || 1; // Default to 1 minute
        
        if (messageLimit < 0) {
            return interaction.reply({ content: '❌ Message limit must be 0 or greater.', flags: [MessageFlags.Ephemeral] });
        }
        
        if (timeWindow <= 0) {
            return interaction.reply({ content: '❌ Time window must be greater than 0.', flags: [MessageFlags.Ephemeral] });
        }
        
        const config = getConfig();
        const rateLimitConfig = config.rateLimitConfig || {};
        rateLimitConfig.limit = messageLimit;
        rateLimitConfig.window = timeWindow;
        
        setConfig({ rateLimitConfig });
        
        if (messageLimit === 0) {
            await interaction.reply({ content: '✅ Rate limiting has been disabled.', flags: [MessageFlags.Ephemeral] });
        } else {
            await interaction.reply({ 
                content: `✅ Rate limiting configured: ${messageLimit} messages per ${timeWindow} minute(s).`, 
                flags: [MessageFlags.Ephemeral]
            });
        }
    },
};
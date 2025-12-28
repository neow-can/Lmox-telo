const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ratestats')
        .setDescription('View current rate limiting statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const config = getConfig();
        const rateLimitConfig = config.rateLimitConfig || { limit: 5, window: 1 };
        const rateLimits = config.rateLimits || {};
        
        // Count users currently rate limited
        const now = Date.now();
        const windowMs = rateLimitConfig.window * 60000;
        let limitedUsers = 0;
        let totalUsers = Object.keys(rateLimits).length;
        
        for (const userId in rateLimits) {
            const userLimit = rateLimits[userId];
            if (now - userLimit.lastReset <= windowMs && userLimit.count >= rateLimitConfig.limit) {
                limitedUsers++;
            }
        }
        
        await interaction.reply({ 
            content: `📊 **Rate Limit Statistics**\n\n` +
                     `**Configuration:**\n` +
                     `- Limit: ${rateLimitConfig.limit} messages\n` +
                     `- Window: ${rateLimitConfig.window} minute(s)\n\n` +
                     `**Current Usage:**\n` +
                     `- Tracked Users: ${totalUsers}\n` +
                     `- Users at Limit: ${limitedUsers}`,
            flags: [MessageFlags.Ephemeral]
        });
    },
};
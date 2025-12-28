const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { setConfig, getMessageStats } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetstats')
        .setDescription('Reset message type statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const currentStats = getMessageStats();
        
        // Reset all stats to 0
        const resetStats = {
            question: 0,
            compliment: 0,
            advice: 0,
            confession: 0
        };
        
        setConfig({ messageStats: resetStats });
        
        await interaction.reply({ 
            content: `✅ **Statistics Reset**\n\n` +
                     `Previous counts:\n` +
                     `❓ Questions: ${currentStats.question}\n` +
                     `😊 Compliments: ${currentStats.compliment}\n` +
                     `💡 Advice: ${currentStats.advice}\n` +
                     `🤫 Confessions: ${currentStats.confession}\n\n` +
                     `All statistics have been reset to zero.`,
            flags: [MessageFlags.Ephemeral]
        });
    },
};
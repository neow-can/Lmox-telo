const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig, getMessageStats } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('msgstats')
        .setDescription('View message type statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const stats = getMessageStats();
        const total = stats.question + stats.compliment + stats.advice + stats.confession;
        
        await interaction.reply({ 
            content: `📊 **Message Type Statistics**\n\n` +
                     `**Total Messages:** ${total}\n\n` +
                     `❓ Questions: ${stats.question}\n` +
                     `😊 Compliments: ${stats.compliment}\n` +
                     `💡 Advice: ${stats.advice}\n` +
                     `🤫 Confessions: ${stats.confession}`,
            flags: [MessageFlags.Ephemeral]
        });
    },
};
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { getConfig } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tellonym')
        .setDescription('Send an anonymous message'),

    async execute(interaction) {
        const config = getConfig();
        if (!config.showTellonym) {
            return interaction.reply({ content: '❌ The Tellonym system is currently disabled.', ephemeral: true, flags: [MessageFlags.Ephemeral] });
        }

        // Check if user is banned
        if (config.bannedUsers && config.bannedUsers.includes(interaction.user.id)) {
            return interaction.reply({ content: '🚫 You are banned from using Tellonym.', ephemeral: true, flags: [MessageFlags.Ephemeral] });
        }

        const modal = new ModalBuilder()
            .setCustomId('tellonym_modal')
            .setTitle('Send Anonymous Message');

        const receiverInput = new TextInputBuilder()
            .setCustomId('receiver')
            .setLabel("Receiver (ID or Username)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const messageInput = new TextInputBuilder()
            .setCustomId('message')
            .setLabel("Message")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(receiverInput);
        const secondActionRow = new ActionRowBuilder().addComponents(messageInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    },
};
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { getConfig, setConfig } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Set channel to show member who send anonymous messages')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel for admin logs')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        setConfig({ adminLogChannelId: channel.id });

        await interaction.reply({ content: `✅ Admin log channel (show tellonym) has been set to ${channel}`, flags: [MessageFlags.Ephemeral] });
    },
};
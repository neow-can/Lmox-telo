const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { getConfig, setConfig } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setshowtellonym')
        .setDescription('Set the tellonym logs channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send tellonym logs to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        setConfig({ logChannelId: channel.id });

        await interaction.reply({ content: `✅ Tellonym logs channel has been set to ${channel}`, flags: [MessageFlags.Ephemeral] });
    },
};
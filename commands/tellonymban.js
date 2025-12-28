const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig, setConfig } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tellonymban')
        .setDescription('Manage user bans for anonymous messages')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ban a user from sending tellonyms')
                .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Unban a user')
                .addUserOption(option => option.setName('user').setDescription('The user to unban').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all banned users'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const config = getConfig();
        let bannedUsers = config.bannedUsers || [];

        if (subcommand === 'add') {
            const user = interaction.options.getUser('user');
            if (bannedUsers.includes(user.id)) {
                return interaction.reply({ content: `⚠️ ${user.tag} is already banned.`, flags: [MessageFlags.Ephemeral] });
            }
            bannedUsers.push(user.id);
            setConfig({ bannedUsers });
            await interaction.reply({ content: `✅ ${user.tag} has been banned from using Tellonym.`, flags: [MessageFlags.Ephemeral] });

        } else if (subcommand === 'remove') {
            const user = interaction.options.getUser('user');
            if (!bannedUsers.includes(user.id)) {
                return interaction.reply({ content: `⚠️ ${user.tag} is not banned.`, flags: [MessageFlags.Ephemeral] });
            }
            bannedUsers = bannedUsers.filter(id => id !== user.id);
            setConfig({ bannedUsers });
            await interaction.reply({ content: `✅ ${user.tag} has been unbanned.`, flags: [MessageFlags.Ephemeral] });

        } else if (subcommand === 'list') {
            if (bannedUsers.length === 0) {
                return interaction.reply({ content: 'No users are currently banned.', flags: [MessageFlags.Ephemeral] });
            }
            const bannedList = bannedUsers.map(id => `<@${id}>`).join(', ');
            await interaction.reply({ content: `🚫 **Banned Users:**\n${bannedList}`, flags: [MessageFlags.Ephemeral] });
        }
    },
};
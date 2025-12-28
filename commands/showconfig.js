const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ThumbnailBuilder,
    MessageFlags
} = require('discord.js');
const { getConfig } = require('../utils/store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showconfig')
        .setDescription('Show Tellonym configuration for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const config = getConfig();
        const { guild } = interaction;
        const color = 0xff2d77; // Cyan

        const container = new ContainerBuilder()
            .setAccentColor(color)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '***## ⚙️ Tellonym Configuration***\n' +
                            `***- Logs Channel:*** ${config.logChannelId ? `<#${config.logChannelId}>` : 'Not Set'}\n` +
                            `***- Admin Logs Channel:*** ${config.adminLogChannelId ? `<#${config.adminLogChannelId}>` : 'Not Set'}\n` +
                            `***- System Status:*** ${config.showTellonym ? 'Enabled' : 'Disabled'}\n` +
                            `***- Banned Users:*** ${config.bannedUsers ? config.bannedUsers.length : 0} users`
                        )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(
                            guild.iconURL({ dynamic: true, size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png'
                        )
                    )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`***${guild.name} • <t:${Math.floor(Date.now() / 1000)}:F>***`)
            );

        await interaction.reply({
            components: [container],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
        });
    },
};
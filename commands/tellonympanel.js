const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tellonympanel')
        .setDescription('Display the Tellonym panel with the button')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const { guild } = interaction;
        const color = 0xff2d77; // Pink/Purple
        const bannerImage = 'https://cdn.discordapp.com/attachments/1439729095452790815/1446652078641385613/IMG_20251206_003500.png?ex=6934c33d&is=693371bd&hm=43d007dbd1b9c1e7581b6c47d69eccaaebec9a30fb4aae197c0e3d1604533a2c&';

        // ---------------------------
        // MAIN CONTAINER
        // ---------------------------
        const container = new ContainerBuilder()
            .setAccentColor(color)

            // SECTION (Text + Server Icon)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '***## Tellonym Panel***\n' +
                            '***- Click the button below to send an anonymous message!***\n' +
                            '***- Messages will be sent to the configured log channel.***'
                        )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(
                            guild.iconURL({ dynamic: true, size: 256 }) ||
                            'https://cdn.discordapp.com/embed/avatars/0.png'
                        )
                    )
            )

            // Separator
            .addSeparatorComponents(new SeparatorBuilder());

        // MEDIA (Banner Image)
        if (bannerImage) {
            const mediaGallery = new MediaGalleryBuilder().addItems([
                { media: { url: bannerImage } }
            ]);
            container.addMediaGalleryComponents(mediaGallery);
        }

        // Separator
        container.addSeparatorComponents(new SeparatorBuilder());

        // ---------------------------
        // BUTTONS
        // ---------------------------
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_tellonym_modal')
                .setLabel('Send Anonymous Message')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💌')
        );

        // ---------------------------
        // SEND PANEL
        // ---------------------------
        // Add components to container and send
        // Note: In V2, the container holds the rows too? 
        // The user's snippet does: container.addActionRowComponents(row)

        container.addActionRowComponents(row);

        // Add footer text
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`***${guild.name} • <t:${Math.floor(Date.now() / 1000)}:F>***`)
        );

        await interaction.editReply({
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        });
    },
};
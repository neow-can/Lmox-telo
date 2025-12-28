const {
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    ThumbnailBuilder,
    MessageFlags,
    StringSelectMenuBuilder
} = require('discord.js');
const { getConfig, isRateLimited, getTimeLeft, updateUserRateLimit, getUserRateLimit, incrementMessageType } = require('../utils/store');
const { generateTellonymCard, generateAdminLogCard, generateReplyCard } = require('../utils/imageGenerator');

// In-memory storage for message mappings (in production, use a database)
const messageMappings = new Map();
const comments = new Map(); // Store comments for each message
const messageCache = new Map(); // Cache for message content
const originalMessages = new Map(); // Cache for original message content
const userSelections = new Map(); // Track user selections
const userComments = new Map(); // Track user comments per message

// Cleanup old message mappings every hour
setInterval(() => {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [key, value] of messageMappings.entries()) {
        if (now - value.timestamp > oneHour) {
            messageMappings.delete(key);
        }
    }
    
    // Also cleanup old comments
    for (const [key, value] of comments.entries()) {
        if (now - value.timestamp > oneHour) {
            comments.delete(key);
        }
    }
    
    // Cleanup old message cache
    for (const [key, value] of messageCache.entries()) {
        if (now - value.timestamp > oneHour) {
            messageCache.delete(key);
        }
    }
    
    // Cleanup old original messages
    for (const [key, value] of originalMessages.entries()) {
        if (now - value.timestamp > oneHour) {
            originalMessages.delete(key);
        }
    }
    
    // Cleanup old user selections
    for (const [key, value] of userSelections.entries()) {
        if (now - value.timestamp > oneHour) {
            userSelections.delete(key);
        }
    }
    
    // Cleanup old user comments tracking
    for (const [key, value] of userComments.entries()) {
        if (now - value.timestamp > oneHour) {
            userComments.delete(key);
        }
    }
}, 60 * 60 * 1000); // Run every hour

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                if (error.code !== 10062 && error.code !== 40060) {
                    console.error(error);
                }
                if (error.code === 10062 || error.code === 40060) return;

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error executing this command!', flags: [MessageFlags.Ephemeral] }).catch(() => { });
                } else {
                    await interaction.reply({ content: 'There was an error executing this command!', flags: [MessageFlags.Ephemeral] }).catch(() => { });
                }
            }
        } else if (interaction.isButton()) {
            try {
                if (interaction.customId === 'open_tellonym_modal') {
                    const config = getConfig();
                    if (!config.showTellonym) {
                        return interaction.reply({ content: '❌ The Tellonym system is currently disabled.', flags: [MessageFlags.Ephemeral] });
                    }

                    if (config.bannedUsers && config.bannedUsers.includes(interaction.user.id)) {
                        return interaction.reply({ content: '🚫 You are banned from using Tellonym.', flags: [MessageFlags.Ephemeral] });
                    }

                    // Rate limiting check
                    if (isRateLimited(interaction.user.id)) {
                        const timeLeft = getTimeLeft(interaction.user.id);
                        return interaction.reply({ 
                            content: `⏳ You've reached the rate limit! Please wait ${timeLeft} seconds before sending another message.`, 
                            flags: [MessageFlags.Ephemeral]
                        });
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
                }
                // Handle reply button - only recipient can use it
                else if (interaction.customId.startsWith('reply_')) {
                    const messageId = interaction.customId.split('_')[1];
                    
                    // Check if we have the mapping
                    if (!messageMappings.has(messageId)) {
                        return interaction.reply({ 
                            content: '❌ Unable to reply to this message. It may be too old.', 
                            flags: [MessageFlags.Ephemeral]
                        });
                    }
                    
                    const mapping = messageMappings.get(messageId);
                    
                    // Only the recipient can reply
                    if (interaction.user.id !== mapping.receiverId) {
                        return interaction.reply({ 
                            content: '❌ Only the recipient of this message can reply to it.', 
                            flags: [MessageFlags.Ephemeral]
                        });
                    }
                    
                    const modal = new ModalBuilder()
                        .setCustomId(`reply_modal_${messageId}`)
                        .setTitle('Reply');

                    const replyInput = new TextInputBuilder()
                        .setCustomId('reply')
                        .setLabel("Your Reply")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(500);

                    const actionRow = new ActionRowBuilder().addComponents(replyInput);
                    modal.addComponents(actionRow);

                    await interaction.showModal(modal);
                }
                // Handle comment button
                else if (interaction.customId.startsWith('comment_')) {
                    const messageId = interaction.customId.split('_')[1];
                    
                    // Check if user already commented on this message
                    const userCommentKey = `${messageId}_${interaction.user.id}`;
                    if (userComments.has(userCommentKey)) {
                        return interaction.reply({ 
                            content: '❌ You have already commented on this message.', 
                            flags: [MessageFlags.Ephemeral]
                        });
                    }
                    
                    // Show a selection menu for anonymous or identified comment
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`comment_type_${messageId}`)
                                .setPlaceholder('Choose comment type')
                                .addOptions(
                                    {
                                        label: 'Anonymous Comment',
                                        description: 'Comment without revealing your identity',
                                        value: 'anonymous',
                                        emoji: '👻'
                                    },
                                    {
                                        label: 'Identified Comment',
                                        description: 'Comment with your identity shown',
                                        value: 'identified',
                                        emoji: '👤'
                                    }
                                )
                        );

                    await interaction.reply({ 
                        content: 'How would you like to comment?', 
                        components: [row], 
                        flags: [MessageFlags.Ephemeral]
                    });
                }
                // Handle auto-refresh to update image with comments
                else if (interaction.customId.startsWith('refresh_auto_')) {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                    const messageId = interaction.customId.split('_')[2];
                    
                    // Check if we have the mapping
                    if (!messageMappings.has(messageId)) {
                        return interaction.editReply({ 
                            content: '❌ Unable to refresh this message. It may be too old.' 
                        });
                    }
                    
                    const mapping = messageMappings.get(messageId);
                    const receiverUser = await interaction.client.users.fetch(mapping.receiverId);
                    
                    // Get the original message content
                    let messageContent = "Original message";
                    if (originalMessages.has(messageId)) {
                        messageContent = originalMessages.get(messageId).content;
                    } else {
                        // Fallback to try to get content from the message
                        try {
                            const channel = interaction.channel;
                            const originalMessage = await channel.messages.fetch(mapping.messageId);
                            // Try to extract content from embed description
                            if (originalMessage.embeds && originalMessage.embeds.length > 0) {
                                const embed = originalMessage.embeds[0];
                                if (embed.description) {
                                    messageContent = embed.description;
                                }
                            }
                        } catch (e) {
                            console.log("Could not fetch original message content");
                        }
                    }
                    
                    // Get comments for this message
                    const commentList = comments.get(messageId) || [];
                    
                    // Generate updated image with comments
                    const messageType = mapping.messageType || "question";
                    const cardBuffer = await generateTellonymCard(messageContent, receiverUser.username, messageType, commentList);
                    const attachment = new AttachmentBuilder(cardBuffer, { name: 'tellonym-card.png' });
                    
                    // Update the original message with the new image
                    try {
                        const channel = interaction.channel;
                        const originalMessage = await channel.messages.fetch(mapping.messageId);
                        await originalMessage.edit({
                            files: [attachment]
                        });
                        await interaction.editReply({ content: '✅ Message automatically updated with your comment!' });
                    } catch (editError) {
                        await interaction.editReply({ content: '❌ Failed to update the message. Please try again.' });
                    }
                }
                // Handle message type selection buttons
                else if (interaction.customId.startsWith('msgtype_')) {
                    await interaction.deferUpdate();
                    
                    const parts = interaction.customId.split('_');
                    const messageType = parts[1];
                    const cacheId = parts[2];
                    
                    // Store user's selection for future use
                    userSelections.set(interaction.user.id, {
                        type: messageType,
                        timestamp: Date.now()
                    });
                    
                    // Process the message type selection
                    await processMessageTypeSelection(interaction, messageType, cacheId);
                }
            } catch (error) {
                console.error("Button Error:", error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred.', flags: [MessageFlags.Ephemeral] }).catch(() => { });
                }
            }
        } else if (interaction.isModalSubmit()) {
            try {
                if (interaction.customId === 'tellonym_modal') {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                    const receiverQuery = interaction.fields.getTextInputValue('receiver');
                    const messageContent = interaction.fields.getTextInputValue('message');
                    const config = getConfig();

                    if (config.bannedUsers && config.bannedUsers.includes(interaction.user.id)) {
                        return interaction.editReply({ content: '🚫 You are banned from using Tellonym.' });
                    }

                    if (!config.logChannelId) {
                        return interaction.editReply({ content: '❌ Logs channel is not configured. Please contact an admin.' });
                    }

                    const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
                    if (!logChannel) {
                        return interaction.editReply({ content: '❌ Logs channel not found. Please contact an admin.' });
                    }

                    // Update rate limit
                    const userLimit = getUserRateLimit(interaction.user.id);
                    updateUserRateLimit(interaction.user.id, userLimit.count + 1);

                    // Validate Receiver - Prevent sending to bots
                    let receiverUser;
                    try {
                        receiverUser = await interaction.client.users.fetch(receiverQuery);
                        
                        // Check if the receiver is a bot
                        if (receiverUser.bot) {
                            return interaction.editReply({ content: `❌ You cannot send anonymous messages to bots.` });
                        }
                    } catch (e) {
                        const member = interaction.guild.members.cache.find(m => m.user.username === receiverQuery || m.user.tag === receiverQuery);
                        if (member) {
                            receiverUser = member.user;
                            
                            // Check if the receiver is a bot
                            if (receiverUser.bot) {
                                return interaction.editReply({ content: `❌ You cannot send anonymous messages to bots.` });
                            }
                        }
                    }

                    if (!receiverUser) {
                        return interaction.editReply({ content: `❌ Could not find user: \`${receiverQuery}\`. Please provide a valid User ID or Username.` });
                    }

                    // Cache the message content
                    const cacheId = Date.now().toString();
                    messageCache.set(cacheId, {
                        content: messageContent,
                        receiverId: receiverUser.id,
                        timestamp: Date.now()
                    });

                    // Check if user already made a selection
                    if (userSelections.has(interaction.user.id)) {
                        // Use the previous selection
                        const previousSelection = userSelections.get(interaction.user.id);
                        const messageType = previousSelection.type;
                        
                        // Process with the selected type
                        await processMessageTypeSelection(interaction, messageType, cacheId);
                    } else {
                        // Ask for message type using buttons instead of select menu
                        const buttonRow1 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`msgtype_question_${cacheId}`)
                                .setLabel('❓ Question')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`msgtype_compliment_${cacheId}`)
                                .setLabel('😊 Compliment')
                                .setStyle(ButtonStyle.Success)
                        );
                        
                        const buttonRow2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`msgtype_advice_${cacheId}`)
                                .setLabel('💡 Advice')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId(`msgtype_confession_${cacheId}`)
                                .setLabel('🤫 Confession')
                                .setStyle(ButtonStyle.Danger)
                        );

                        await interaction.editReply({ 
                            content: 'What type of message is this?',
                            components: [buttonRow1, buttonRow2]
                        });
                    }
                }
                // Handle reply submission
                else if (interaction.customId.startsWith('reply_modal_')) {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                    
                    const messageId = interaction.customId.split('_')[2];
                    const replyContent = interaction.fields.getTextInputValue('reply');
                    
                    // Check if we have the mapping
                    if (!messageMappings.has(messageId)) {
                        return interaction.editReply({ 
                            content: '❌ Unable to reply to this message. It may be too old.' 
                        });
                    }
                    
                    const mapping = messageMappings.get(messageId);
                    const originalSender = await interaction.client.users.fetch(mapping.senderId);
                    
                    try {
                        // Generate reply image with replier's name
                        const replyCardBuffer = await generateReplyCard(replyContent, interaction.user.username, interaction.user.displayAvatarURL({ extension: 'png', size: 256 }));
                        const replyAttachment = new AttachmentBuilder(replyCardBuffer, { name: 'reply-card.png' });
                        
                        // Send DM to original sender with image
                        await originalSender.send({
                            content: `📩 **${interaction.user.username} replied to your anonymous message!**`,
                            files: [replyAttachment]
                        });
                        
                        // Confirm to replier
                        await interaction.editReply({ 
                            content: '✅ Your reply has been sent!' 
                        });
                    } catch (error) {
                        console.error('Error sending DM:', error);
                        await interaction.editReply({ 
                            content: '❌ Failed to send your reply. The user might have DMs disabled.' 
                        });
                    }
                }
                // Handle comment submission
                else if (interaction.customId.startsWith('comment_modal_')) {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                    
                    const parts = interaction.customId.split('_');
                    const messageId = parts[2];
                    const commentType = parts[3];
                    const commentContent = interaction.fields.getTextInputValue('comment');
                    
                    // Check if user already commented on this message
                    const userCommentKey = `${messageId}_${interaction.user.id}`;
                    if (userComments.has(userCommentKey)) {
                        return interaction.editReply({ 
                            content: '❌ You have already commented on this message.' 
                        });
                    }
                    
                    // Store comment
                    if (!comments.has(messageId)) {
                        comments.set(messageId, []);
                    }
                    
                    const commentList = comments.get(messageId);
                    commentList.push({
                        type: commentType,
                        author: {
                            id: interaction.user.id,
                            username: interaction.user.username,
                            avatarURL: interaction.user.displayAvatarURL({ extension: 'png', size: 64 })
                        },
                        content: commentContent,
                        timestamp: Date.now()
                    });
                    
                    // Track that this user has commented
                    userComments.set(userCommentKey, {
                        timestamp: Date.now()
                    });
                    
                    // Auto-refresh the message image
                    const refreshRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`refresh_auto_${messageId}`)
                                .setLabel('Auto-Update Message')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Confirm to commenter with auto-refresh button
                    if (commentType === 'anonymous') {
                        await interaction.editReply({ 
                            content: '✔ Your anonymous comment has been added! Click the button below to automatically update the message with your comment:',
                            components: [refreshRow]
                        });
                    } else {
                        await interaction.editReply({ 
                            content: `✔ Your comment has been added as ${interaction.user.username}! Click the button below to automatically update the message with your comment:`,
                            components: [refreshRow]
                        });
                    }
                }
            } catch (error) {
                if (error.code !== 10062 && error.code !== 40060) {
                    console.error("Modal Error:", error);
                }
                if (error.code === 10062 || error.code === 40060) return;
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'An error occurred.', flags: [MessageFlags.Ephemeral] }).catch(() => { });
                } else {
                    await interaction.reply({ content: 'An error occurred.', flags: [MessageFlags.Ephemeral] }).catch(() => { });
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            try {
                // Handle comment type selection
                if (interaction.customId.startsWith('comment_type_')) {
                    const messageId = interaction.customId.split('_')[2];
                    
                    // Check if user already commented on this message
                    const userCommentKey = `${messageId}_${interaction.user.id}`;
                    if (userComments.has(userCommentKey)) {
                        return interaction.update({ 
                            content: '❌ You have already commented on this message.',
                            components: []
                        });
                    }
                    
                    const commentType = interaction.values[0];
                    
                    const modal = new ModalBuilder()
                        .setCustomId(`comment_modal_${messageId}_${commentType}`)
                        .setTitle(commentType === 'anonymous' ? 'Add Anonymous Comment' : 'Add Identified Comment');

                    const commentInput = new TextInputBuilder()
                        .setCustomId('comment')
                        .setLabel("Your Comment")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(200);

                    const actionRow = new ActionRowBuilder().addComponents(commentInput);
                    modal.addComponents(actionRow);

                    await interaction.showModal(modal);
                }
            } catch (error) {
                console.error("Select Menu Error:", error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred.', flags: [MessageFlags.Ephemeral] }).catch(() => { });
                }
            }
        }
    },
};

// Helper function to process message type selection
async function processMessageTypeSelection(interaction, messageType, cacheId) {
    // Get cached message data
    const cachedData = messageCache.get(cacheId);
    if (!cachedData) {
        return interaction.editReply({ 
            content: '❌ Message data expired. Please try sending your message again.',
            components: []
        });
    }
    
    const messageContent = cachedData.content;
    const receiverUser = await interaction.client.users.fetch(cachedData.receiverId);
    const config = getConfig();
    const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
    
    // Remove from cache since we've used it
    messageCache.delete(cacheId);
    
    // Increment message type statistics
    incrementMessageType(messageType);
    
    // Store original message content
    originalMessages.set(interaction.id, {
        content: messageContent,
        timestamp: Date.now()
    });
    
    // Generate Image without sender info to keep it anonymous
    // Get comments for this message (should be empty initially)
    const commentList = comments.get(interaction.id) || [];
    const cardBuffer = await generateTellonymCard(messageContent, receiverUser.username, messageType, commentList);
    const attachment = new AttachmentBuilder(cardBuffer, { name: 'tellonym-card.png' });

    // --- Public Log (V2) with ContainerBuilder ---
    const logContainer = new ContainerBuilder()
        .setAccentColor(0xff2d77)
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `***## New ${messageType.charAt(0).toUpperCase() + messageType.slice(1)}***\n` +
                        `***- Message Sent To:*** ${receiverUser}`
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(
                        interaction.guild.iconURL({ dynamic: true, size: 256 }) ||
                        'https://cdn.discordapp.com/embed/avatars/0.png'
                    )
                )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems([
                { media: { url: 'attachment://tellonym-card.png' } }
            ])
        )
        .addSeparatorComponents(new SeparatorBuilder());

    // Add comment and reply buttons (comment on left, reply on right with same color)
    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`comment_${interaction.id}`)
            .setLabel('💬 Add Comment')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`reply_${interaction.id}`)
            .setLabel('↩️ Reply')
            .setStyle(ButtonStyle.Secondary)
    );
    
    logContainer.addActionRowComponents(buttonRow);

    // Add footer
    logContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "***Sent Anonymously***\n" +
            "***" + interaction.guild.name + " • <t:" + Math.floor(Date.now() / 1000) + ":F>***"
        )
    );

    const message = await logChannel.send({
        components: [logContainer],
        files: [attachment],
        flags: [MessageFlags.IsComponentsV2]
    });
    
    // Store the mapping between message and sender
    messageMappings.set(interaction.id, {
        senderId: interaction.user.id,
        receiverId: receiverUser.id,
        messageId: message.id,
        messageType: messageType,
        timestamp: Date.now()
    });

    // --- Admin Log (V2) ---
    if (config.adminLogChannelId) {
        const adminLogChannel = interaction.guild.channels.cache.get(config.adminLogChannelId);
        if (adminLogChannel) {
            try {
                const senderData = {
                    username: interaction.user.username,
                    avatarUrl: interaction.user.displayAvatarURL({ extension: 'png', size: 256 })
                };
                const receiverData = {
                    username: receiverUser.username,
                    avatarUrl: receiverUser.displayAvatarURL({ extension: 'png', size: 256 })
                };

                const adminCardBuffer = await generateAdminLogCard(messageContent, senderData, receiverData);
                const adminAttachment = new AttachmentBuilder(adminCardBuffer, { name: 'admin-tellonym-card.png' });

                const adminContainer = new ContainerBuilder()
                    .setAccentColor(0xff2d77)
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    "## 📋 ***Tellonym Send From*** " + interaction.user + " **to** " + receiverUser
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL(
                                    interaction.guild.iconURL({ dynamic: true, size: 256 }) ||
                                    'https://cdn.discordapp.com/embed/avatars/0.png'
                                )
                            )
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems([
                            { media: { url: 'attachment://admin-tellonym-card.png' } }
                        ])
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            "***" + interaction.guild.name + " • <t:" + Math.floor(Date.now() / 1000) + ":F>***"
                        )
                    );

                await adminLogChannel.send({
                    components: [adminContainer],
                    files: [adminAttachment],
                    flags: [MessageFlags.IsComponentsV2]
                });

            } catch (error) {
                console.error("Error sending admin log:", error);
                // Fallback V2
                const fallbackContainer = new ContainerBuilder()
                    .setAccentColor(0xff2d77)
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '***## Admin Log: New Tellonym (Image Failed)***\n' +
                                    '***- Sender:*** ' + interaction.user + ' (' + interaction.user.tag + ' / ' + interaction.user.id + ')\n' +
                                    '***- Receiver:*** ' + receiverUser + ' (' + receiverUser.tag + ')\n' +
                                    '***- Message:***\n' + messageContent
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL(
                                    interaction.guild.iconURL({ dynamic: true, size: 256 }) ||
                                    'https://cdn.discordapp.com/embed/avatars/0.png'
                                )
                            )
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            "***" + interaction.guild.name + " • <t:" + Math.floor(Date.now() / 1000) + ":F>***"
                        )
                    );

                await adminLogChannel.send({
                    components: [fallbackContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }
        }
    }

    // Update the original reply to confirm the message was sent
    await interaction.editReply({ 
        content: '✔ Your anonymous message has been sent!', 
        components: [] 
    });
}
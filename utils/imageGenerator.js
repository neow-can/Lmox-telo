const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas');

// Define colors for different message types
const typeColors = {
    question: { primary: '#3498db', secondary: '#2980b9', accent: '#1f618d' },    // Blue
    compliment: { primary: '#2ecc71', secondary: '#27ae60', accent: '#1e8449' },  // Green
    advice: { primary: '#f1c40f', secondary: '#f39c12', accent: '#d35400' },     // Yellow/Orange
    confession: { primary: '#9b59b6', secondary: '#8e44ad', accent: '#6c3483' }  // Purple
};

// Get color based on message type or default to pink
function getTypeColors(type) {
    return typeColors[type] || { primary: '#ff4081', secondary: '#e91e63', accent: '#c2185b' };
}

async function generateTellonymCard(message, receiverName, messageType = null, comments = []) {
    const colors = getTypeColors(messageType);
    // Calculate height based on content
    const baseHeight = 800;
    const commentHeight = comments.length > 0 ? (comments.length * 130) + 150 : 0;
    const height = baseHeight + commentHeight;
    
    const canvas = createCanvas(1400, height);
    const ctx = canvas.getContext('2d');

    // Professional dashboard background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1400, height);

    // Header section
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, 1400, 80);
    
    // Logo area
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(50, 40, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Brand text
    ctx.font = 'bold 24px "Arial", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('TELLONYM', 80, 48);

    // Main content panel with shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(50, 120, 1300, height - 170, 20);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Dashboard header with message type
    const headerGradient = ctx.createLinearGradient(0, 140, 1400, 220);
    headerGradient.addColorStop(0, colors.primary);
    headerGradient.addColorStop(1, colors.accent);
    ctx.fillStyle = headerGradient;
    ctx.beginPath();
    ctx.roundRect(70, 140, 1260, 80, [15, 15, 0, 0]);
    ctx.fill();

    // Header Text
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Different header text based on message type
    let headerText = "ANONYMOUS MESSAGE";
    if (messageType) {
        headerText = messageType.toUpperCase();
        if (messageType === 'question') headerText = "❓ QUESTION";
        else if (messageType === 'compliment') headerText = "😊 COMPLIMENT";
        else if (messageType === 'advice') headerText = "💡 ADVICE";
        else if (messageType === 'confession') headerText = "🤫 CONFESSION";
    }
    
    ctx.fillText(headerText, 700, 180);

    // Message content area with professional styling
    const boxX = 90;
    const boxY = 250;
    const boxWidth = 1220;
    const boxHeight = 300;

    // Message background with subtle gradient
    const contentGradient = ctx.createLinearGradient(0, boxY, 0, boxY + boxHeight);
    contentGradient.addColorStop(0, '#f8f9fa');
    contentGradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = contentGradient;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.fill();

    // Message border with type-specific color
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Message Text with professional typography
    ctx.fillStyle = '#212529';
    ctx.font = '26px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const maxTextWidth = boxWidth - 60;
    const lineHeight = 38;
    const maxLines = Math.floor((boxHeight - 60) / lineHeight);

    // Advanced Text Wrapping with hyphenation
    let lines = [];
    const paragraphs = message.split('\n');

    for (const paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            let testLine = currentLine + (currentLine ? ' ' : '') + word;
            let metrics = ctx.measureText(testLine);

            if (metrics.width > maxTextWidth) {
                if (ctx.measureText(word).width > maxTextWidth) {
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    // Handle very long words
                    let chars = word.split('');
                    let partialWord = '';
                    for (let char of chars) {
                        if (ctx.measureText(partialWord + char).width > maxTextWidth) {
                            lines.push(partialWord);
                            partialWord = char;
                        } else {
                            partialWord += char;
                        }
                    }
                    currentLine = partialWord;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
    }

    // Draw Text
    let textY = boxY + 30;
    for (let i = 0; i < lines.length && i < maxLines; i++) {
        ctx.fillText(lines[i], boxX + 30, textY + (i * lineHeight));
    }

    // Comments section
    if (comments.length > 0) {
        const commentsY = boxY + boxHeight + 40;
        
        // Comments header
        ctx.fillStyle = '#0f3460';
        ctx.beginPath();
        ctx.roundRect(70, commentsY, 1260, 60, [15, 15, 0, 0]);
        ctx.fill();
        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`COMMENTS (${comments.length})`, 100, commentsY + 35);
        
        // Comments container
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(70, commentsY + 70, 1260, commentHeight - 100, [0, 0, 15, 15]);
        ctx.fill();
        
        // Draw each comment
        let currentY = commentsY + 100;
        for (let i = 0; i < comments.length && i < 5; i++) {
            const comment = comments[i];
            
            // Comment separator
            if (i > 0) {
                ctx.strokeStyle = '#e9ecef';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(100, currentY - 20);
                ctx.lineTo(1300, currentY - 20);
                ctx.stroke();
            }
            
            // Author info
            ctx.font = 'bold 20px "Segoe UI", sans-serif';
            ctx.fillStyle = comment.type === 'anonymous' ? '#6c757d' : '#0f3460';
            ctx.textAlign = 'left';
            
            const authorName = comment.type === 'anonymous' ? 'ANONYMOUS' : comment.author.username.toUpperCase();
            
            if (comment.type === 'anonymous') {
                // For anonymous comments, just show the name
                ctx.fillText(authorName, 130, currentY);
            } else {
                // For identified comments, show name and avatar
                ctx.fillText(authorName, 180, currentY);
                
                // Try to draw user avatar
                try {
                    const avatar = await loadImage(comment.author.avatarURL);
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(145, currentY - 15, 28, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    
                    // Add shadow to avatar
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 3;
                    ctx.shadowOffsetY = 3;
                    ctx.drawImage(avatar, 117, currentY - 43, 56, 56);
                    ctx.restore();
                    
                    // Reset shadow
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                } catch (e) {
                    // Professional placeholder for avatar
                    ctx.fillStyle = '#e9ecef';
                    ctx.beginPath();
                    ctx.arc(145, currentY - 15, 28, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#6c757d';
                    ctx.font = '24px "Segoe UI", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('👤', 145, currentY - 15);
                }
            }
            
            // Comment content
            ctx.font = '18px "Segoe UI", sans-serif';
            ctx.fillStyle = '#495057';
            
            // Wrap comment text
            const commentLines = [];
            const commentWords = comment.content.split(' ');
            let commentLine = '';
            
            for (let j = 0; j < commentWords.length; j++) {
                let word = commentWords[j];
                let testLine = commentLine + (commentLine ? ' ' : '') + word;
                let metrics = ctx.measureText(testLine);
                
                if (metrics.width > (comment.type === 'anonymous' ? 1200 : 1150)) {
                    if (commentLine) {
                        commentLines.push(commentLine);
                        commentLine = word;
                    } else {
                        commentLines.push(word.substring(0, 100) + '...');
                        break;
                    }
                } else {
                    commentLine = testLine;
                }
            }
            if (commentLine) commentLines.push(commentLine);
            
            // Draw comment lines
            for (let k = 0; k < commentLines.length && k < 3; k++) {
                ctx.fillText(commentLines[k], comment.type === 'anonymous' ? 130 : 180, currentY + 40 + (k * 30));
            }
            
            currentY += 130;
        }
    }

    // Footer
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, height - 40, 1400, 40);
    ctx.fillStyle = '#a9bcd0';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("ANONYMOUS MESSAGING PLATFORM", 700, height - 20);

    return canvas.toBuffer('image/png');
}

async function generateReplyCard(reply, replierName, replierAvatarUrl) {
    const width = 1400;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Professional dashboard background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#1a5d1a');
    bgGradient.addColorStop(1, '#27ae60');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Header section
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, 0, width, 80);
    
    // Logo area
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(50, 40, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Brand text
    ctx.font = 'bold 24px "Arial", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('TELLONYM', 80, 48);

    // Main content panel with shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(50, 120, 1300, height - 170, 20);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Dashboard header
    const headerGradient = ctx.createLinearGradient(0, 140, width, 220);
    headerGradient.addColorStop(0, '#27ae60');
    headerGradient.addColorStop(1, '#219653');
    ctx.fillStyle = headerGradient;
    ctx.beginPath();
    ctx.roundRect(70, 140, 1260, 80, [15, 15, 0, 0]);
    ctx.fill();

    // Header Text
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("NEW REPLY", 700, 180);

    // Replier info
    ctx.fillStyle = '#e8f5e9';
    ctx.beginPath();
    ctx.roundRect(90, 240, 1220, 60, 12);
    ctx.fill();
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillStyle = '#27ae60';
    ctx.textAlign = 'left';
    ctx.fillText("FROM: " + replierName.toUpperCase(), 120, 275);

    // Reply content area
    const boxX = 90;
    const boxY = 320;
    const boxWidth = 1220;
    const boxHeight = 280;

    // Reply background with subtle gradient
    const contentGradient = ctx.createLinearGradient(0, boxY, 0, boxY + boxHeight);
    contentGradient.addColorStop(0, '#f8f9fa');
    contentGradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = contentGradient;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.fill();

    // Reply border
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Reply Text
    ctx.fillStyle = '#212529';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const maxTextWidth = boxWidth - 60;
    const lineHeight = 35;
    const maxLines = Math.floor((boxHeight - 60) / lineHeight);

    // Advanced Text Wrapping
    let lines = [];
    const paragraphs = reply.split('\n');

    for (const paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            let testLine = currentLine + (currentLine ? ' ' : '') + word;
            let metrics = ctx.measureText(testLine);

            if (metrics.width > maxTextWidth) {
                if (ctx.measureText(word).width > maxTextWidth) {
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    let chars = word.split('');
                    let partialWord = '';
                    for (let char of chars) {
                        if (ctx.measureText(partialWord + char).width > maxTextWidth) {
                            lines.push(partialWord);
                            partialWord = char;
                        } else {
                            partialWord += char;
                        }
                    }
                    currentLine = partialWord;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
    }

    // Draw Text
    let textY = boxY + 30;
    for (let i = 0; i < lines.length && i < maxLines; i++) {
        ctx.fillText(lines[i], boxX + 30, textY + (i * lineHeight));
    }

    // Footer
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, height - 40, width, 40);
    ctx.fillStyle = '#a3d9a3';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("ANONYMOUS MESSAGING PLATFORM", 700, height - 20);

    return canvas.toBuffer('image/png');
}

async function generateAdminLogCard(message, sender, receiver) {
    const width = 1400;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Professional dashboard background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#5d1a5d');
    bgGradient.addColorStop(1, '#8e44ad');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Header section
    ctx.fillStyle = '#3a1e3a';
    ctx.fillRect(0, 0, width, 80);
    
    // Logo area
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(50, 40, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Brand text
    ctx.font = 'bold 24px "Arial", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('TELLONYM', 80, 48);

    // Main content panel with shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(50, 120, 1300, height - 170, 20);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Dashboard header
    const headerGradient = ctx.createLinearGradient(0, 140, width, 220);
    headerGradient.addColorStop(0, '#8e44ad');
    headerGradient.addColorStop(1, '#7d3c98');
    ctx.fillStyle = headerGradient;
    ctx.beginPath();
    ctx.roundRect(70, 140, 1260, 80, [15, 15, 0, 0]);
    ctx.fill();

    // Header Text
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("ADMIN LOG", 700, 180);

    // User info section
    const avatarSize = 120;
    const avatarY = 260;
    const senderX = 350;
    const receiverX = width - 350 - avatarSize;

    // Load Avatars
    try {
        const senderAvatar = await loadImage(sender.avatarUrl);
        const receiverAvatar = await loadImage(receiver.avatarUrl);

        // Draw Sender Avatar with shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(senderX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(senderAvatar, senderX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw Receiver Avatar with shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(receiverX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(receiverAvatar, receiverX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } catch (e) {
        console.error("Failed to load avatars", e);
    }

    // Usernames
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sender.username.toUpperCase(), senderX + avatarSize / 2, avatarY + avatarSize + 50);
    ctx.fillText(receiver.username.toUpperCase(), receiverX + avatarSize / 2, avatarY + avatarSize + 50);

    // Arrow
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(senderX + avatarSize + 60, avatarY + avatarSize / 2);
    ctx.lineTo(receiverX - 60, avatarY + avatarSize / 2);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(receiverX - 90, avatarY + avatarSize / 2 - 25);
    ctx.lineTo(receiverX - 60, avatarY + avatarSize / 2);
    ctx.lineTo(receiverX - 90, avatarY + avatarSize / 2 + 25);
    ctx.stroke();

    // Message content area
    const boxX = 90;
    const boxY = 450;
    const boxWidth = 1220;
    const boxHeight = 250;

    // Message background with subtle gradient
    const contentGradient = ctx.createLinearGradient(0, boxY, 0, boxY + boxHeight);
    contentGradient.addColorStop(0, '#f8f9fa');
    contentGradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = contentGradient;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.fill();

    // Message border
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Message Text
    ctx.fillStyle = '#212529';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const maxTextWidth = boxWidth - 60;
    const lineHeight = 35;
    const maxLines = Math.floor((boxHeight - 60) / lineHeight);

    // Text Wrapping
    let lines = [];
    const paragraphs = message.split('\n');

    for (const paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            let testLine = currentLine + (currentLine ? ' ' : '') + word;
            let metrics = ctx.measureText(testLine);

            if (metrics.width > maxTextWidth) {
                if (ctx.measureText(word).width > maxTextWidth) {
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    let chars = word.split('');
                    let partialWord = '';
                    for (let char of chars) {
                        if (ctx.measureText(partialWord + char).width > maxTextWidth) {
                            lines.push(partialWord);
                            partialWord = char;
                        } else {
                            partialWord += char;
                        }
                    }
                    currentLine = partialWord;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
    }

    let textY = boxY + 30;
    for (let i = 0; i < lines.length && i < maxLines; i++) {
        ctx.fillText(lines[i], boxX + 30, textY + (i * lineHeight));
    }

    // Footer
    ctx.fillStyle = '#3a1e3a';
    ctx.fillRect(0, height - 40, width, 40);
    ctx.fillStyle = '#d9a3d9';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("ANONYMOUS MESSAGING PLATFORM", 700, height - 20);

    return canvas.toBuffer('image/png');
}

module.exports = { generateTellonymCard, generateAdminLogCard, generateReplyCard };
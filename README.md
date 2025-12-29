# Tellonym Discord Bot

A Discord bot that allows users to send anonymous messages, similar to Tellonym. This bot provides a secure and private way for community members to communicate with each other anonymously.

## 🚀 Features

- **Anonymous Messaging**: Send messages without revealing your identity
- **Message Types**: Choose from different message types (Question, Compliment, Advice, Confession)
- **Comment System**: Add comments to messages either anonymously or with your identity
- **Reply Functionality**: Recipients can reply to anonymous messages
- **Rate Limiting**: Prevents spam with configurable rate limits
- **Admin Controls**: Comprehensive admin commands for configuration
- **Statistics Tracking**: Monitor message types and usage statistics
- **Visual Cards**: Beautifully designed image cards for messages

## 🛠️ Technologies Used

- Node.js
- Discord.js v14
- @napi-rs/canvas for image generation
- dotenv for environment configuration

## 📋 Prerequisites

- Node.js 16.6.0 or higher
- Discord Bot Token (get it from [Discord Developer Portal](https://discord.com/developers/applications))

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone .(https://github.com/neow-can/Lmox-telo)
   cd bot-tellonym-v1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   DISCORD_TOKEN=your_bot_token_here
   ```

4. **Run the bot**
   ```bash
   node index.js
   ```

## ⚙️ Configuration

The bot uses a configuration system that can be managed through slash commands:

- `/setlogs channel:#channel` - Sets the channel where anonymous messages will be sent
- `/setshowtellonym enabled:true/false` - Enables or disables the system
- `/tellonymban user:@user action:ban/unban` - Ban or unban users from using the bot
- `/ratelimit limit:5 window:1` - Configure rate limits (messages per minute)
- `/msgstats` - View message statistics
- `/ratestats` - View rate limit statistics
- `/resetstats` - Reset all statistics
- `/showconfig` - Show current configuration

## 🎮 Commands

### User Commands
- `/tellonym` - Send an anonymous message with modal interface
- `/help` - Show help information

### Admin Commands
- All configuration commands mentioned above

## 📊 Message Types

The bot supports 4 different message types:
- **Question** ❓
- **Compliment** 😊
- **Advice** 💡
- **Confession** 🤫

Each message type has its own color scheme and visual styling.

## 🔐 Privacy & Security

- All messages are sent anonymously by default
- Comment system allows both anonymous and identified comments
- Rate limiting prevents spam and abuse
- Admin logs track all activities for moderation
- Secure message handling with proper validation

## 🖼️ Image Generation

The bot generates beautiful, professional image cards for messages using canvas. Each card includes:
- Custom styling based on message type
- Clean, modern design
- Proper text wrapping and formatting
- Professional branding

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please open an issue in the repository.

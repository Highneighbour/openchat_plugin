# @elizaos/plugin-openchat

OpenChat integration plugin for ElizaOS - enables AI agents to interact with the OpenChat platform (oc.app).

## 🌟 Features

- **Command Execution**: Users can interact with your ElizaOS agent via OpenChat commands
- **Autonomous Operation**: Agent can autonomously respond to messages and events
- **Event Subscriptions**: Subscribe to messages, member joins, and other chat events
- **Multi-Installation Support**: Install bot in multiple groups, channels, and direct messages
- **Full ElizaOS Integration**: Works seamlessly with ElizaOS actions, providers, and memory system
- **Rich Message Support**: Send text, images, videos, audio, files, and polls (coming soon)

## 📋 Prerequisites

- Node.js 18+ or Bun
- ElizaOS CLI installed
- OpenSSL (for generating bot identity)
- Access to OpenChat platform

## 🚀 Installation

### 1. Generate Bot Identity

First, generate a private key for your bot:

```bash
openssl ecparam -genkey -name secp256k1 -out private_key.pem
```

**Important**: Keep this private key secure! Do not commit it to version control.

### 2. Get OpenChat Configuration

Navigate to your OpenChat profile (in the environment where you want to run the bot):
1. Go to your profile
2. Open "Advanced" section
3. Click "Bot client data"
4. Copy the following values:
   - OpenChat Public Key
   - IC Host URL
   - Storage Index Canister ID

### 3. Install Plugin

If using the plugin locally (for development/testing):

```bash
# In your ElizaOS project
npm install /path/to/plugin-openchat
# or with Bun
bun add /path/to/plugin-openchat
```

When published to npm:

```bash
npm install @elizaos/plugin-openchat
# or with Bun
bun add @elizaos/plugin-openchat
```

### 4. Configure Environment Variables

Add the following to your `.env` file:

```env
# OpenChat Bot Configuration
OPENCHAT_BOT_IDENTITY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"
OPENCHAT_PUBLIC_KEY="your-openchat-public-key"
OPENCHAT_IC_HOST="https://ic0.app"
OPENCHAT_STORAGE_INDEX_CANISTER="your-storage-canister-id"
OPENCHAT_BOT_PORT="3000"

# Optional: Welcome new members
OPENCHAT_WELCOME_NEW_MEMBERS="true"
```

**Note**: For the private key, either:
- Paste the entire key content with `\n` for newlines, or
- Use `OPENCHAT_BOT_IDENTITY_PRIVATE_KEY_PATH="./private_key.pem"` (requires code modification)

### 5. Add Plugin to Your Agent

In your agent's character file or configuration:

```typescript
import { openchatPlugin } from "@elizaos/plugin-openchat";

export default {
    name: "YourAgent",
    plugins: [openchatPlugin],
    // ... rest of your character configuration
};
```

Or in your `package.json` agent configuration:

```json
{
  "name": "your-agent",
  "plugins": ["@elizaos/plugin-openchat"],
  // ...
}
```

## 🎮 Usage

### Starting Your Agent

```bash
# Using ElizaOS CLI
elizaos start

# Or if running directly
npm start
# or
bun start
```

When the agent starts, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║                  OpenChat Bot Ready                       ║
╠════════════════════════════════════════════════════════════╣
║  Bot server running on port 3000                           ║
║  Bot definition: http://localhost:3000/bot_definition     ║
║                                                            ║
║  Next steps:                                               ║
║  1. Register bot on OpenChat using /register_bot          ║
║  2. Install bot in desired chats/groups                   ║
║  3. Users can interact via /chat command                  ║
╚════════════════════════════════════════════════════════════╝
```

### Registering Your Bot on OpenChat

1. **Get Bot Principal**: 
   ```bash
   # Use the provided script (create this helper)
   node -e "const fs = require('fs'); const pemKey = fs.readFileSync('./private_key.pem', 'utf8'); console.log('Bot Principal:', pemKey);"
   ```

2. **Register on OpenChat**:
   - Open OpenChat in developer mode
   - Use the `/register_bot` command
   - Enter your bot's URL: `http://your-server:3000`
   - Provide the bot principal
   - OpenChat will fetch and validate your bot definition

3. **Install Your Bot**:
   - As a group/community owner, add the bot via members panel
   - Or start a direct chat with the bot
   - Grant the requested permissions

### Interacting with Your Bot

Users can interact with your bot using these commands:

- `/chat <message>` - Chat with the agent
- `/help` - Get help and available commands
- `/info` - Get information about the agent

Example:
```
/chat Tell me about yourself
/chat What can you help me with?
```

### Autonomous Responses

The bot can also respond autonomously when:
- Mentioned in a group chat: `@YourAgent hello!`
- Messaged directly in a direct chat
- Configured to respond to specific events

## 🏗️ Architecture

### Plugin Structure

```
plugin-openchat/
├── src/
│   ├── actions/           # ElizaOS actions
│   │   ├── sendMessage.ts # Send message to OpenChat
│   │   └── index.ts
│   ├── providers/         # Context providers
│   │   ├── chatContext.ts # OpenChat context info
│   │   └── index.ts
│   ├── services/          # Core services
│   │   └── openchatClient.ts # Main client service
│   ├── bot/               # OpenChat bot implementation
│   │   ├── handlers/      # Command & event handlers
│   │   │   ├── executeCommand.ts
│   │   │   ├── notify.ts
│   │   │   └── schema.ts
│   │   └── middleware/    # Express middleware
│   │       └── botclient.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── index.ts           # Plugin entry point
├── package.json
├── tsconfig.json
└── README.md
```

### How It Works

1. **Bot Server**: Express server runs on configured port, exposing OpenChat bot endpoints
2. **Command Handler**: Receives commands from OpenChat, processes via ElizaOS runtime
3. **Event Handler**: Receives events (messages, joins, etc.) via `/notify` endpoint
4. **Actions**: ElizaOS actions allow agents to send messages to OpenChat
5. **Providers**: Supply context about OpenChat installations to the agent

### Integration Points

```
OpenChat Platform
       ↓ (commands & events)
Bot Server (Express)
       ↓
Command/Event Handlers
       ↓
ElizaOS Runtime ←→ Agent Logic
       ↓
Actions & Providers
       ↓
OpenChat Bot Client
       ↓ (responses)
OpenChat Platform
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENCHAT_BOT_IDENTITY_PRIVATE_KEY` | Yes | Bot's private key (PEM format) | `-----BEGIN EC PRIVATE KEY-----\n...` |
| `OPENCHAT_PUBLIC_KEY` | Yes | OpenChat public key for JWT verification | `MIGCMB0G...` |
| `OPENCHAT_IC_HOST` | Yes | Internet Computer host URL | `https://ic0.app` |
| `OPENCHAT_STORAGE_INDEX_CANISTER` | Yes | Storage index canister ID | `6hsbt-vqaaa...` |
| `OPENCHAT_BOT_PORT` | No | Port for bot server | `3000` |
| `OPENCHAT_WELCOME_NEW_MEMBERS` | No | Welcome new members | `true` |

### Bot Permissions

The bot requests these permissions (configurable in `schema.ts`):

**Message Permissions:**
- Text, Image, Video, Audio, File

**Chat Permissions:**
- ReactToMessages
- ReadMessages
- ReadChatSummary
- DeleteMessages
- SendMessages

### Customizing Commands

Edit `src/bot/handlers/schema.ts` to modify bot commands:

```typescript
commands: [
    {
        name: "your_command",
        default_role: "Participant",
        description: "Your command description",
        permissions: Permissions.encodePermissions({
            // ... permissions
        }),
        params: [
            // ... parameters
        ],
    },
]
```

Then implement the handler in `src/bot/handlers/executeCommand.ts`.

## 🎯 Examples

### Basic Agent with OpenChat

```typescript
// character.ts
import { Character } from "@elizaos/core";
import { openchatPlugin } from "@elizaos/plugin-openchat";

export const character: Character = {
    name: "Assistant",
    bio: [
        "A helpful AI assistant on OpenChat",
        "I can answer questions and help with various tasks"
    ],
    topics: ["general", "help", "information"],
    style: {
        all: ["helpful", "friendly", "concise"],
        chat: ["engaging", "responsive"]
    },
    plugins: [openchatPlugin],
};
```

### Sending Messages from Actions

```typescript
import { Action, IAgentRuntime } from "@elizaos/core";
import { OpenChatClientService } from "@elizaos/plugin-openchat";

export const myAction: Action = {
    name: "MY_ACTION",
    description: "Do something and notify on OpenChat",
    handler: async (runtime: IAgentRuntime, message, state) => {
        // Your action logic here
        const result = await doSomething();
        
        // Send result to OpenChat
        const service = runtime.getService("openchat") as OpenChatClientService;
        const installations = service.getInstallations();
        
        // Send to all installations
        for (const [key, { scope, permissions }] of installations) {
            const client = service.createClientForScope(scope, 
                runtime.getSetting("OPENCHAT_IC_HOST")!, 
                permissions
            );
            await client.sendTextMessage(`Task completed: ${result}`);
        }
        
        return true;
    }
};
```

## 🐛 Troubleshooting

### Bot Won't Start

**Issue**: Missing environment variables
```
Error: Missing required environment variables
```

**Solution**: Ensure all required variables are set in `.env`

---

**Issue**: Port already in use
```
Error: EADDRINUSE: address already in use
```

**Solution**: Change `OPENCHAT_BOT_PORT` or stop the conflicting service

### Bot Not Responding

**Issue**: Commands not working

**Checklist**:
1. ✅ Is the bot server running?
2. ✅ Is the bot registered on OpenChat?
3. ✅ Is the bot installed in the chat?
4. ✅ Are permissions granted?
5. ✅ Check bot server logs for errors

### JWT Verification Errors

**Issue**: `Invalid JWT token`

**Solution**: 
- Verify `OPENCHAT_PUBLIC_KEY` matches your environment
- Ensure you're using the correct OpenChat environment (local/testnet/mainnet)

### Message Not Sending

**Issue**: Messages fail to send

**Checklist**:
1. ✅ Does the bot have `SendMessages` permission?
2. ✅ Is the bot installed in the target chat?
3. ✅ Check network connectivity to IC host

## 🚧 Roadmap

- [x] Basic command execution
- [x] Autonomous message handling
- [x] Event subscriptions
- [x] Multiple installation support
- [ ] Rich message types (images, videos, files)
- [ ] Reaction handling
- [ ] Message deletion
- [ ] Poll creation
- [ ] Channel management actions
- [ ] Community-level operations
- [ ] Enhanced message threading
- [ ] User profile access
- [ ] Chat history retrieval

## 📚 Resources

- [OpenChat Bot Documentation](https://github.com/open-chat-labs/open-chat-bots)
- [OpenChat Platform](https://oc.app)
- [ElizaOS Documentation](https://docs.elizaos.ai/)
- [Internet Computer](https://internetcomputer.org/)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

- GitHub Issues: [Report bugs or request features]
- OpenChat: Join the OpenChat community
- ElizaOS Discord: Get help from the ElizaOS community

## 🙏 Acknowledgments

- OpenChat Labs for the amazing bot framework
- ElizaOS team for the agent runtime
- Internet Computer community

---

Built with ❤️ for the OpenChat and ElizaOS communities

# Quick Start Guide - OpenChat Plugin for ElizaOS

Get your ElizaOS agent running on OpenChat in 10 minutes!

## ⚡ Fast Setup

### Step 1: Generate Bot Identity (30 seconds)

```bash
openssl ecparam -genkey -name secp256k1 -out private_key.pem
```

**Important**: Keep `private_key.pem` secret and secure!

### Step 2: Get OpenChat Config (2 minutes)

1. Go to [OpenChat](https://oc.app)
2. Click your profile → Advanced
3. Click "Bot client data"
4. Copy these values:
   - OpenChat Public Key
   - IC Host
   - Storage Index Canister

### Step 3: Install Plugin (1 minute)

```bash
# In your ElizaOS project directory
npm install /path/to/plugin-openchat
# or
bun add /path/to/plugin-openchat
```

### Step 4: Configure Environment (2 minutes)

Create or edit `.env`:

```bash
# Copy your private key content here (replace \n with actual newlines in file or use \n)
OPENCHAT_BOT_IDENTITY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END EC PRIVATE KEY-----"

# Paste values from OpenChat
OPENCHAT_PUBLIC_KEY="your-public-key"
OPENCHAT_IC_HOST="https://ic0.app"
OPENCHAT_STORAGE_INDEX_CANISTER="your-canister-id"

OPENCHAT_BOT_PORT="3000"
```

### Step 5: Add to Your Character (1 minute)

```typescript
// character.ts
import { openchatPlugin } from "@elizaos/plugin-openchat";

export const character = {
    name: "YourBot",
    bio: ["I'm a helpful AI assistant on OpenChat"],
    plugins: [openchatPlugin],
    // ... rest of config
};
```

### Step 6: Start Your Agent (30 seconds)

```bash
elizaos start
# or
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║      OpenChat Bot Ready               ║
║  Running on port 3000                 ║
╚════════════════════════════════════════╝
```

### Step 7: Register Bot on OpenChat (2 minutes)

1. In OpenChat, use `/register_bot` command
2. Enter bot URL: `http://your-server-ip:3000`
3. Enter bot principal (from your setup)
4. Review and confirm bot definition

### Step 8: Install Bot (1 minute)

1. Go to any group you own (or create one)
2. Click Members → Add bot
3. Find your bot and add it
4. Grant requested permissions

### Step 9: Test It! (30 seconds)

In the chat where you installed the bot:

```
/chat Hello! Are you there?
```

You should get a response from your agent! 🎉

## 🎯 What You Can Do Now

### User Commands
```
/chat <message>    - Chat with the AI agent
/help              - Show available commands  
/info              - Get bot information
```

### Mention the Bot
```
@YourBot what's the weather like?
```

### Direct Message
Just start a DM with your bot and send messages!

## 🐛 Troubleshooting

**Bot not responding?**
- Check bot server is running (`http://localhost:3000/bot_definition` should work)
- Verify environment variables are set correctly
- Check bot is installed and has permissions
- Look at console logs for errors

**Registration failed?**
- Ensure bot URL is accessible from OpenChat
- Check private key format is correct
- Verify you're using the right environment (mainnet/testnet)

**Permission errors?**
- Make sure you granted permissions when installing
- Check bot definition has correct permissions requested

## 📚 Next Steps

- [Full Documentation](./README.md) - Detailed usage and features
- [Advanced Configuration](./README.md#configuration-options) - Customize your bot
- [Examples](./examples/) - See example implementations
- [API Reference](./README.md#architecture) - Plugin architecture

## 💬 Need Help?

- Check [README.md](./README.md) for detailed docs
- Review [OpenChat Bot Docs](https://github.com/open-chat-labs/open-chat-bots)
- Join ElizaOS Discord community
- Open an issue on GitHub

---

**Congratulations!** 🎊 Your ElizaOS agent is now live on OpenChat!

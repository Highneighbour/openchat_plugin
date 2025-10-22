import { Plugin, IAgentRuntime } from "@elizaos/core";
import { OpenChatClientService } from "./services/openchatClient.js";
import { OpenChatBotConfig } from "./types/index.js";
import { actions } from "./actions/index.js";
import { providers } from "./providers/index.js";
import { evaluators } from "./evaluators/index.js";

/**
 * OpenChat Plugin for ElizaOS
 * 
 * This plugin enables ElizaOS agents to interact with the OpenChat platform (oc.app).
 * It provides both command-based interaction (users can execute bot commands) and
 * autonomous operation (bot can respond to messages and events).
 * 
 * Features:
 * - Command execution via OpenChat interface
 * - Autonomous message handling and responses
 * - Event subscriptions (messages, member joins, etc.)
 * - Multiple installation support (groups, channels, direct messages)
 * - Full ElizaOS action and provider integration
 * 
 * Setup:
 * 1. Generate bot identity: `openssl ecparam -genkey -name secp256k1 -out private_key.pem`
 * 2. Set environment variables (see package.json agentConfig)
 * 3. Register bot on OpenChat using `/register_bot` command
 * 4. Install bot in desired chats/groups/communities
 * 
 * Environment Variables:
 * - OPENCHAT_BOT_IDENTITY_PRIVATE_KEY: Bot's private key (PEM format)
 * - OPENCHAT_PUBLIC_KEY: OpenChat public key for JWT verification
 * - OPENCHAT_IC_HOST: Internet Computer host URL
 * - OPENCHAT_STORAGE_INDEX_CANISTER: Storage index canister ID
 * - OPENCHAT_BOT_PORT: Bot server port (default: 3000)
 */
export const openchatPlugin: Plugin = {
    name: "openchat",
    description: "OpenChat integration for ElizaOS agents",
    
    actions,
    providers,
    evaluators,
    services: [],

    /**
     * Initialize the OpenChat plugin
     */
    init: async (_config: Record<string, string>, runtime: IAgentRuntime) => {
        runtime.logger?.info("Initializing OpenChat plugin...");

        // Validate required environment variables
        const requiredEnvVars = [
            "OPENCHAT_BOT_IDENTITY_PRIVATE_KEY",
            "OPENCHAT_PUBLIC_KEY",
            "OPENCHAT_IC_HOST",
            "OPENCHAT_STORAGE_INDEX_CANISTER",
        ];

        const missingVars = requiredEnvVars.filter(
            (varName) => !runtime.getSetting(varName)
        );

        if (missingVars.length > 0) {
            throw new Error(
                `Missing required environment variables for OpenChat plugin: ${missingVars.join(", ")}\n\n` +
                `Please set these variables in your .env file or environment.\n` +
                `See plugin documentation for setup instructions.`
            );
        }

        // Create bot configuration
        const botConfig: OpenChatBotConfig = {
            identityPrivateKey: runtime.getSetting("OPENCHAT_BOT_IDENTITY_PRIVATE_KEY")!,
            openchatPublicKey: runtime.getSetting("OPENCHAT_PUBLIC_KEY")!,
            icHost: runtime.getSetting("OPENCHAT_IC_HOST")!,
            openStorageCanisterId: runtime.getSetting("OPENCHAT_STORAGE_INDEX_CANISTER")!,
            port: parseInt(runtime.getSetting("OPENCHAT_BOT_PORT") || "3000"),
        };

        // Initialize OpenChat client service
        const service = new OpenChatClientService(runtime, botConfig);

        // Register service with runtime
        (runtime as any).registerService?.("openchat", service);

        // Start bot server
        await service.start();

        if (runtime.logger?.success) {
            runtime.logger.success("OpenChat plugin initialized successfully!");
        }
        runtime.logger?.info(
            `\n` +
            `╔════════════════════════════════════════════════════════════╗\n` +
            `║                  OpenChat Bot Ready                       ║\n` +
            `╠════════════════════════════════════════════════════════════╣\n` +
            `║  Bot server running on port ${botConfig.port}                        ║\n` +
            `║  Bot definition: http://localhost:${botConfig.port}/bot_definition  ║\n` +
            `║                                                            ║\n` +
            `║  Next steps:                                               ║\n` +
            `║  1. Register bot on OpenChat using /register_bot          ║\n` +
            `║  2. Install bot in desired chats/groups                   ║\n` +
            `║  3. Users can interact via /chat command                  ║\n` +
            `╚════════════════════════════════════════════════════════════╝\n`
        );
    },

};

// Export types for external use
export * from "./types/index.js";
export { OpenChatClientService } from "./services/openchatClient.js";
export { actions } from "./actions/index.js";
export { providers } from "./providers/index.js";
export { evaluators } from "./evaluators/index.js";

// Default export
export default openchatPlugin;
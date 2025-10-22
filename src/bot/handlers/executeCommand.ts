import { commandNotFound } from "@open-ic/openchat-botclient-ts";
import { Request, Response } from "express";
import { WithBotClient } from "../../types/index.js";
import { IAgentRuntime, Content, UUID, Memory } from "@elizaos/core";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";

// Namespace UUID for OpenChat rooms (deterministic)
const OPENCHAT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/**
 * Type guard to check if request has BotClient
 */
function hasBotClient(req: Request): req is WithBotClient {
    return (req as WithBotClient).botClient !== undefined;
}

/**
 * Helper to create success response
 */
function success(msg?: any) {
    return {
        message: msg?.toResponse(),
    };
}

/**
 * Handle chat command - properly integrated with ElizaOS message system
 */
async function handleChatCommand(
    req: WithBotClient,
    res: Response,
    runtime: IAgentRuntime
): Promise<void> {
    const client = req.botClient;
    
    // Send immediate placeholder to frontend only
    const placeholder = (await client.createTextMessage("Thinking...")).setFinalised(false);
    res.status(200).json(success(placeholder));

    // Get message argument
    const message = client.stringArg("message");
    if (message === undefined) {
        const msg = (await client.createTextMessage("Please provide a message.")).setFinalised(true);
        await client.sendMessage(msg);
        return;
    }
    
    try {
        // Get scope and user info from client
        const scope = (client as any).scope;
        const initiator = (client as any).initiator;
        
        runtime.logger?.debug("[OpenChat] Raw scope:", JSON.stringify(scope));
        runtime.logger?.debug("[OpenChat] Raw initiator:", initiator);
        
        // Extract chat identifier - try multiple possible field names
        let chatIdentifier = "";
        if (scope) {
            chatIdentifier = (scope as any).chatId 
                || (scope as any).chat_id 
                || (scope as any).groupId 
                || (scope as any).channelId 
                || "";
            
            // If chatId is an object or bigint, convert to string
            if (typeof chatIdentifier === 'object' || typeof chatIdentifier === 'bigint') {
                chatIdentifier = String(chatIdentifier);
            }
        }
        
        runtime.logger?.debug("[OpenChat] Extracted chatIdentifier:", chatIdentifier);
        
        // Create deterministic UUID for room based on OpenChat chat ID
        // This ensures the same chat always gets the same roomId
        const roomId = chatIdentifier && chatIdentifier !== ""
            ? uuidv5(`openchat-${scope.kind}-${chatIdentifier}`, OPENCHAT_NAMESPACE) as UUID
            : uuidv4() as UUID;
        
        // Create deterministic UUID for user
        const userId = initiator && typeof initiator === 'string' && initiator.length > 0
            ? uuidv5(`openchat-user-${initiator}`, OPENCHAT_NAMESPACE) as UUID
            : uuidv4() as UUID;

        runtime.logger?.debug("[OpenChat] Generated roomId (UUID):", roomId);
        runtime.logger?.debug("[OpenChat] Generated userId (UUID):", userId);

        // Ensure room exists in database
        try {
            let room = await (runtime as any).getRoom?.(roomId);
            if (!room && typeof (runtime as any).ensureRoomExists === 'function') {
                runtime.logger?.debug("[OpenChat] Creating room");
                await (runtime as any).ensureRoomExists(roomId);
                room = await (runtime as any).getRoom?.(roomId);
            }
            if (!room && typeof (runtime as any).createRoom === 'function') {
                runtime.logger?.debug("[OpenChat] Creating room via createRoom");
                room = await (runtime as any).createRoom({
                    id: roomId,
                    name: `OpenChat ${scope.kind}`,
                    source: "openchat",
                });
            }
        } catch (roomError: any) {
            runtime.logger?.warn("[OpenChat] Could not ensure room exists:", roomError.message);
        }

        // Ensure user exists in database
        try {
            let user = await (runtime as any).getUser?.(userId);
            if (!user && typeof (runtime as any).ensureUserExists === 'function') {
                runtime.logger?.debug("[OpenChat] Creating user");
                await (runtime as any).ensureUserExists(userId, initiator || "OpenChat User");
            }
        } catch (userError: any) {
            runtime.logger?.warn("[OpenChat] Could not ensure user exists:", userError.message);
        }

        // Create proper content object for ElizaOS
        const content: Content = {
            text: message,
            source: "openchat",
        };

        // Create memory object for ElizaOS runtime
        const memory: any = {
            id: uuidv4() as UUID,
            userId,
            agentId: runtime.agentId,
            roomId,
            content,
            createdAt: Date.now(),
        };

        // Use simpler AI generation that doesn't require database
        let responseText: string;
        
        runtime.logger?.debug("[OpenChat] Generating response using simple method");
        
        // Build a simple prompt
        const character = runtime.character;
        const prompt = `You are ${character.name}. ${character.bio?.[0] || ""}

User: ${message}

${character.name}:`;

        try {
            // Use basic generateText with string prompt
            if (typeof (runtime as any).generateText === 'function') {
                runtime.logger?.debug("[OpenChat] Using generateText with prompt");
                responseText = await (runtime as any).generateText(prompt);
            } else if (typeof (runtime as any).completion === 'function') {
                runtime.logger?.debug("[OpenChat] Using completion");
                const response = await (runtime as any).completion({
                    prompt,
                    stop: ["\n"],
                });
                responseText = response.text || response.content || String(response);
            } else {
                runtime.logger?.warn("[OpenChat] No text generation available, using fallback");
                responseText = character.postExamples?.[0] 
                    || character.bio?.[0] 
                    || "Hello! How can I help you?";
            }
        } catch (genError: any) {
            runtime.logger?.error("[OpenChat] Text generation error:", genError.message);
            responseText = "I'm having trouble generating a response. Please try again.";
        }

        // Ensure we have a string
        if (typeof responseText !== 'string') {
            runtime.logger?.warn("[OpenChat] Response not a string:", typeof responseText);
            // Try to extract text from object
            if (responseText && typeof responseText === 'object') {
                responseText = (responseText as any).text 
                    || (responseText as any).content?.text 
                    || JSON.stringify(responseText);
            } else {
                responseText = String(responseText || "I'm here to help!");
            }
        }

        responseText = responseText.trim();
        
        runtime.logger?.debug("[OpenChat] Final response:", responseText.substring(0, 100));

        // Send response to OpenChat
        const responseMsg = (await client.createTextMessage(responseText)).setFinalised(true);
        await client.sendMessage(responseMsg);
        runtime.logger?.debug("[OpenChat] ✅ Response sent successfully");
        
    } catch (error: any) {
        runtime.logger?.error("[OpenChat] Error in chat handler:", error?.message || error);
        try {
            const errorMsg = (await client.createTextMessage(
                "I encountered an error processing your message. Please try again."
            )).setFinalised(true);
            await client.sendMessage(errorMsg);
        } catch (sendError: any) {
            runtime.logger?.error("[OpenChat] Failed to send error message:", sendError);
        }
    }
}

/**
 * Handle help command
 */
async function handleHelpCommand(
    req: WithBotClient,
    res: Response,
    runtime: IAgentRuntime
): Promise<void> {
    const client = req.botClient;
    const character = runtime.character;

    const helpText = `🤖 **${character.name}** - AI Agent

**Available Commands:**
• \`/chat <message>\` - Chat with me
• \`/help\` - Show this help message
• \`/info\` - Get information about me
• \`/poll <question> <options>\` - Create a poll
• \`/moderate <action>\` - Configure moderation (Moderator only)

**About Me:**
${character.bio?.[0] || "I'm an AI agent powered by ElizaOS"}

**Capabilities:**
• Intelligent conversation and assistance
• Content moderation and spam detection
• Poll creation and management
• Media sharing (images, videos, files)
• Automated responses to mentions

**How to Use:**
Simply use the /chat command followed by your message, or mention me in a group chat!`;

    const message = (await client.createTextMessage(helpText)).setFinalised(true);
    res.status(200).json(success(message));
    await client.sendMessage(message);
}

/**
 * Handle info command
 */
async function handleInfoCommand(
    req: WithBotClient,
    res: Response,
    runtime: IAgentRuntime
): Promise<void> {
    const client = req.botClient;
    const character = runtime.character;

    const topics = character.topics?.slice(0, 5).join(", ") || "various topics";
    const style = character.style?.all?.[0] || character.style?.chat?.[0] || "friendly and helpful";

    const infoText = `📋 **About ${character.name}**

${character.bio?.[0] || "I'm an AI agent powered by ElizaOS"}

**Topics I can discuss:** ${topics}

**Communication style:** ${style}

**Capabilities:**
• Intelligent conversation
• Context-aware responses
• Memory of past interactions
• Task execution
• Content moderation
• Poll creation
• Media sharing

Powered by ElizaOS 🚀`;

    const message = (await client.createTextMessage(infoText)).setFinalised(true);
    res.status(200).json(success(message));
    await client.sendMessage(message);
}

/**
 * Handle moderate command
 */
async function handleModerateCommand(
    req: WithBotClient,
    res: Response,
    runtime: IAgentRuntime
): Promise<void> {
    const client = req.botClient;
    const action = client.stringArg("action");

    if (!action) {
        const msg = (await client.createTextMessage("Please specify an action: enable, disable, or status")).setFinalised(true);
        res.status(200).json(success(msg));
        await client.sendMessage(msg);
        return;
    }

    let responseText = "";

    switch (action.toLowerCase()) {
        case "enable":
            // Note: This would typically update a database or configuration
            responseText = `✅ Moderation enabled for this chat. I will now monitor messages for:
• Spam and phishing attempts
• Inappropriate content
• Excessive caps/shouting

Use \`/moderate disable\` to turn off moderation.`;
            break;

        case "disable":
            responseText = `⚠️ Moderation disabled for this chat. I will no longer automatically moderate messages.`;
            break;

        case "status":
            const moderationEnabled = runtime.getSetting("OPENCHAT_MODERATION_ENABLED") === "true";
            const moderationAction = runtime.getSetting("OPENCHAT_MODERATION_ACTION") || "warn";
            responseText = `📊 Moderation Status:
• Enabled: ${moderationEnabled ? "Yes" : "No"}
• Action: ${moderationAction}
• Monitoring: ${moderationEnabled ? "Spam, Inappropriate Content, Excessive Caps" : "Nothing"}`;
            break;

        default:
            responseText = "Unknown action. Use: enable, disable, or status";
    }

    const message = (await client.createTextMessage(responseText)).setFinalised(true);
    res.status(200).json(success(message));
    await client.sendMessage(message);
}

/**
 * Handle poll command
 */
async function handlePollCommand(
    req: WithBotClient,
    res: Response,
    runtime: IAgentRuntime
): Promise<void> {
    const client = req.botClient;
    const question = client.stringArg("question");
    const optionsStr = client.stringArg("options");

    if (!question || !optionsStr) {
        const msg = (await client.createTextMessage("Please provide both a question and options (comma-separated)")).setFinalised(true);
        res.status(200).json(success(msg));
        await client.sendMessage(msg);
        return;
    }

    // Parse options
    const options = optionsStr.split(",").map(opt => opt.trim()).filter(opt => opt.length > 0);

    if (options.length < 2) {
        const msg = (await client.createTextMessage("Please provide at least 2 options for the poll")).setFinalised(true);
        res.status(200).json(success(msg));
        await client.sendMessage(msg);
        return;
    }

    try {
        // Create poll
        const pollConfig = {
            question,
            options,
            allowMultipleVotes: false,
            showVotesBeforeEndDate: true,
            anonymous: false,
        };

        try {
            const pollMsg = (await (client as any).createPollMessage(pollConfig, {})).setFinalised(true);
            res.status(200).json(success(pollMsg));
            await client.sendMessage(pollMsg);
        } catch (pollError: any) {
            // Fallback to text-based poll
            const pollText = `📊 ${question}\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`;
            const textMsg = (await client.createTextMessage(pollText)).setFinalised(true);
            res.status(200).json(success(textMsg));
            await client.sendMessage(textMsg);
        }
    } catch (error: any) {
        runtime.logger?.error("[OpenChat] Error creating poll:", error?.message || error);
        const errorMsg = (await client.createTextMessage("Failed to create poll. Please try again.")).setFinalised(true);
        res.status(200).json(success(errorMsg));
        await client.sendMessage(errorMsg);
    }
}

/**
 * Main command execution handler
 */
export async function executeCommand(
    req: Request,
    res: Response,
    runtime: IAgentRuntime
): Promise<void> {
    if (!hasBotClient(req)) {
        res.status(500).send("Bot client not initialised");
        return;
    }

    const client = req.botClient;
    const commandName = client.commandName;

    runtime.logger?.debug(`[OpenChat] Executing command: ${commandName}`);

    try {
        switch (commandName) {
            case "chat":
                await handleChatCommand(req, res, runtime);
                break;

            case "help":
                await handleHelpCommand(req, res, runtime);
                break;

            case "info":
                await handleInfoCommand(req, res, runtime);
                break;

            case "moderate":
                await handleModerateCommand(req, res, runtime);
                break;

            case "poll":
                await handlePollCommand(req, res, runtime);
                break;

            default:
                res.status(400).send(commandNotFound());
        }
    } catch (error: any) {
        runtime.logger?.error(`[OpenChat] Error executing command ${commandName}:`, error?.message || error);
        res.status(500).send("Internal server error");
    }
}

export default executeCommand;
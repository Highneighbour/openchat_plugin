import { Request, Response } from "express";
import { IAgentRuntime, Content, UUID } from "@elizaos/core";
import { OpenChatClientService } from "../../services/openchatClient.js";
import { v4 as uuidv4 } from "uuid";
import { decode } from "@msgpack/msgpack";

/**
 * Parse MessagePack notification payload
 */
function parseNotification(buffer: Buffer): any {
    try {
        // Decode MessagePack payload
        const decoded = decode(buffer);
        return decoded;
    } catch (error) {
        console.error("Error parsing notification:", error);
        // Fallback to basic structure if decode fails
        try {
            // Try JSON parsing as fallback
            return JSON.parse(buffer.toString("utf8"));
        } catch {
            return null;
        }
    }
}

/**
 * Handle bot installation event
 */
async function handleInstallation(
    event: any,
    runtime: IAgentRuntime,
    service: OpenChatClientService
): Promise<void> {
    runtime.logger.info("[OpenChat] Bot installed:", event);

    const scope = event.scope;
    const permissions = event.permissions || [];
    const scopeKey = `${scope.kind}-${scope.chatId}`;

    service.recordInstallation(scopeKey, scope, permissions);

    // Send welcome message if we have permission
    if (permissions.includes("SendMessages")) {
        try {
            const client = service.createClientForScope(
                scope,
                scope.apiGateway || runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            const welcomeMessage = `👋 Hello! I'm ${runtime.character.name}, your AI assistant.

${runtime.character.bio?.[0] || "I'm here to help you with various tasks and conversations."}

Use \`/help\` to see available commands or \`/chat <message>\` to start chatting with me!`;

            const msg = (await client.createTextMessage(welcomeMessage)).setFinalised(true);
            await client.sendMessage(msg);
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error sending welcome message:", error?.message || error);
        }
    }
}

/**
 * Handle bot uninstallation event
 */
async function handleUninstallation(
    event: any,
    runtime: IAgentRuntime,
    service: OpenChatClientService
): Promise<void> {
    runtime.logger.info("[OpenChat] Bot uninstalled:", event);

    const scope = event.scope;
    const scopeKey = `${scope.kind}-${scope.chatId}`;

    service.recordUninstallation(scopeKey);
}

/**
 * Handle message event (for autonomous processing)
 */
async function handleMessage(
    event: any,
    runtime: IAgentRuntime,
    service: OpenChatClientService
): Promise<void> {
    runtime.logger.debug("[OpenChat] Message event received");

    const scope = event.scope;
    const message = event.message || event.data?.message || event;
    const sender = event.sender || event.data?.sender || message.sender;
    const messageText = message.text || message.content?.text || "";

    // Skip messages from the bot itself
    if (sender === runtime.agentId || sender === "bot") {
        return;
    }

    // Check if bot is mentioned or if it's a direct message
    const isMentioned = messageText?.includes(`@${runtime.character.name}`);
    const isDirectMessage = scope.kind === "direct";
    
    // Check if auto-response is enabled for all messages
    const autoRespond = runtime.getSetting("OPENCHAT_AUTO_RESPOND_ALL") === "true";

    if (!isMentioned && !isDirectMessage && !autoRespond) {
        return; // Don't respond to messages that don't mention the bot
    }

    try {
        const scopeKey = `${scope.kind}-${scope.chatId}`;
        const installation = service.getInstallations().get(scopeKey);

        if (!installation) {
            runtime.logger.warn("[OpenChat] Received message from untracked installation");
            return;
        }

        const client = service.createClientForScope(
            scope,
            scope.apiGateway || runtime.getSetting("OPENCHAT_IC_HOST") || "",
            installation.permissions
        );

        // Remove mention from message text for cleaner processing
        const cleanText = messageText.replace(`@${runtime.character.name}`, "").trim();

        // Build a simple prompt for response
        const character = runtime.character;
        const prompt = `You are ${character.name}. ${character.bio?.[0] || ""}

User: ${cleanText}

${character.name}:`;

        let responseText: string;

        try {
            // Use basic generateText with string prompt
            if (typeof (runtime as any).generateText === 'function') {
                responseText = await (runtime as any).generateText(prompt);
            } else if (typeof (runtime as any).completion === 'function') {
                const response = await (runtime as any).completion({
                    prompt,
                    stop: ["\n"],
                });
                responseText = response.text || response.content || String(response);
            } else {
                responseText = "Thanks for mentioning me! How can I help you?";
            }
        } catch (genError: any) {
            runtime.logger?.error("[OpenChat] Text generation error:", genError.message);
            responseText = "I'm having trouble generating a response. Please try again.";
        }

        // Ensure we have a string
        if (typeof responseText !== 'string') {
            responseText = String(responseText || "I'm here to help!");
        }

        responseText = responseText.trim();

        // Send response to OpenChat
        const msg = (await client.createTextMessage(responseText)).setFinalised(true);
        await client.sendMessage(msg);
        
        runtime.logger?.debug("[OpenChat] ✅ Autonomous response sent");
    } catch (error: any) {
        runtime.logger?.error("[OpenChat] Error handling message:", error?.message || error);
    }
}

/**
 * Handle member joined event
 */
async function handleMemberJoined(
    event: any,
    runtime: IAgentRuntime,
    service: OpenChatClientService
): Promise<void> {
    runtime.logger.debug("[OpenChat] Member joined:", event);

    const scope = event.scope;
    const member = event.member;

    // Send welcome message to new member if configured
    const shouldWelcome = runtime.getSetting("OPENCHAT_WELCOME_NEW_MEMBERS") === "true";

    if (shouldWelcome) {
        try {
            const scopeKey = `${scope.kind}-${scope.chatId}`;
            const installation = service.getInstallations().get(scopeKey);

            if (installation?.permissions.includes("SendMessages")) {
                const client = service.createClientForScope(
                    scope,
                    scope.apiGateway || runtime.getSetting("OPENCHAT_IC_HOST") || "",
                    installation.permissions
                );

                const welcomeMsg = `Welcome to the chat, ${member.username}! 👋`;
                const msg = (await client.createTextMessage(welcomeMsg)).setFinalised(true);
                await client.sendMessage(msg);
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error welcoming member:", error?.message || error);
        }
    }
}

/**
 * Handle reaction event
 */
async function handleReaction(
    event: any,
    runtime: IAgentRuntime,
    service: OpenChatClientService
): Promise<void> {
    runtime.logger.debug("[OpenChat] Reaction event received");
    
    // Can be extended to track reactions, respond to specific reactions, etc.
    const scope = event.scope;
    const reaction = event.reaction || event.data?.reaction;
    const messageId = event.messageId || event.data?.messageId;
    const userId = event.userId || event.data?.userId;
    
    runtime.logger.debug(`[OpenChat] User ${userId} reacted with ${reaction} to message ${messageId}`);
}

/**
 * Handle member left event
 */
async function handleMemberLeft(
    event: any,
    runtime: IAgentRuntime,
    service: OpenChatClientService
): Promise<void> {
    runtime.logger.debug("[OpenChat] Member left event received");
    
    const scope = event.scope;
    const member = event.member || event.data?.member;
    
    // Optionally send goodbye message
    const shouldSayGoodbye = runtime.getSetting("OPENCHAT_SAY_GOODBYE") === "true";
    
    if (shouldSayGoodbye) {
        try {
            const scopeKey = `${scope.kind}-${scope.chatId}`;
            const installation = service.getInstallations().get(scopeKey);
            
            if (installation?.permissions.includes("SendMessages")) {
                const client = service.createClientForScope(
                    scope,
                    scope.apiGateway || runtime.getSetting("OPENCHAT_IC_HOST") || "",
                    installation.permissions
                );
                
                const goodbyeMsg = `Goodbye ${member.username}! 👋`;
                const msg = (await client.createTextMessage(goodbyeMsg)).setFinalised(true);
                await client.sendMessage(msg);
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error sending goodbye message:", error?.message || error);
        }
    }
}

/**
 * Main notification handler
 */
export async function notifyHandler(
    req: Request,
    res: Response,
    runtime: IAgentRuntime,
    service: OpenChatClientService
): Promise<void> {
    try {
        runtime.logger.debug("[OpenChat] Notification received");

        // Parse notification payload
        const notification = parseNotification(req.body as Buffer);

        if (!notification) {
            res.status(400).send("Invalid notification payload");
            return;
        }

        // Determine event type - try multiple possible field names
        const eventType = notification.type 
            || notification.eventType 
            || notification.event_type
            || (notification.data?.type)
            || "unknown";

        runtime.logger.debug(`[OpenChat] Event type: ${eventType}`);

        // Handle different event types
        switch (eventType) {
            case "bot_installed":
            case "BotInstalled":
            case "installed":
                await handleInstallation(notification, runtime, service);
                break;

            case "bot_uninstalled":
            case "BotUninstalled":
            case "uninstalled":
                await handleUninstallation(notification, runtime, service);
                break;

            case "message":
            case "Message":
            case "MessageSent":
                await handleMessage(notification, runtime, service);
                break;

            case "member_joined":
            case "MemberJoined":
            case "MembersJoined":
                await handleMemberJoined(notification, runtime, service);
                break;

            case "member_left":
            case "MemberLeft":
            case "MembersLeft":
                await handleMemberLeft(notification, runtime, service);
                break;

            case "reaction":
            case "Reaction":
            case "ReactionAdded":
                await handleReaction(notification, runtime, service);
                break;

            default:
                runtime.logger.debug(`[OpenChat] Unhandled event type: ${eventType}`);
        }

        res.status(200).send("OK");
    } catch (error: any) {
        runtime.logger?.error("[OpenChat] Error handling notification:", error?.message || error);
        res.status(500).send("Internal server error");
    }
}

export default notifyHandler;
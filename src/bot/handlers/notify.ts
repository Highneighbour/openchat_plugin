import { Request, Response } from "express";
import { IAgentRuntime, Content, UUID } from "@elizaos/core";
import { OpenChatClientService } from "../../services/openchatClient.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Parse MessagePack notification payload
 * Note: This is a simplified parser. In production, use a proper MessagePack library
 */
function parseNotification(buffer: Buffer): any {
    try {
        // For now, return a basic structure
        // In production, implement proper MessagePack decoding
        return {
            type: "unknown",
            payload: buffer.toString("base64"),
        };
    } catch (error) {
        console.error("Error parsing notification:", error);
        return null;
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
    runtime.logger.debug("[OpenChat] Message event received:", event);

    const scope = event.scope;
    const message = event.message;
    const sender = event.sender;

    // Skip messages from the bot itself
    if (sender === runtime.agentId) {
        return;
    }

    // Check if bot is mentioned or if it's a direct message
    const isMentioned = message.text?.includes(`@${runtime.character.name}`);
    const isDirectMessage = scope.kind === "direct";

    if (!isMentioned && !isDirectMessage) {
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

        // Process message through ElizaOS
        const roomId = `openchat-${scope.kind}-${scope.chatId}` as UUID;
        const userId = sender as UUID;

        const content: Content = {
            text: message.text,
            source: "openchat",
            inReplyTo: message.replyTo,
        };

        // Generate simple response
        const responseText = `Thanks for mentioning me! How can I help you?`;
        const msg = (await client.createTextMessage(responseText)).setFinalised(true);
        await client.sendMessage(msg);
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

        // Handle different event types
        switch (notification.type) {
            case "bot_installed":
                await handleInstallation(notification, runtime, service);
                break;

            case "bot_uninstalled":
                await handleUninstallation(notification, runtime, service);
                break;

            case "message":
                await handleMessage(notification, runtime, service);
                break;

            case "member_joined":
                await handleMemberJoined(notification, runtime, service);
                break;

            default:
                runtime.logger.debug(`[OpenChat] Unhandled event type: ${notification.type}`);
        }

        res.status(200).send("OK");
    } catch (error: any) {
        runtime.logger?.error("[OpenChat] Error handling notification:", error?.message || error);
        res.status(500).send("Internal server error");
    }
}

export default notifyHandler;
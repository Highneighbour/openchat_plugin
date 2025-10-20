import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { OpenChatClientService } from "../services/openchatClient.js";
import { OpenChatScope } from "../types/index.js";

/**
 * Action to send a message to OpenChat
 */
export const sendMessageAction: Action = {
    name: "SEND_OPENCHAT_MESSAGE",
    description: "Send a message to an OpenChat group, channel, or direct chat",
    similes: [
        "SEND_MESSAGE_TO_OPENCHAT",
        "POST_TO_OPENCHAT",
        "MESSAGE_OPENCHAT",
        "REPLY_ON_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Send a message to the OpenChat group saying hello",
                },
            } as any,
            {
                content: {
                    text: "I'll send that message to OpenChat.",
                    action: "SEND_OPENCHAT_MESSAGE",
                },
            } as any,
        ],
    ],

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            // Check if OpenChat service is available
            const service = (runtime as any).getService?.("openchat") as OpenChatClientService | undefined;

            if (!service) {
                return false;
            }

            // Validate that we have at least one installation
            return service.getInstallations().size > 0;
        } catch {
            return false;
        }
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        try {
            const service = (runtime as any).getService("openchat") as OpenChatClientService;

            if (!service) {
                runtime.logger?.error("[OpenChat] Service not available");
                return;
            }

            // Extract message text
            const messageText = message.content.text;

            if (!messageText) {
                runtime.logger?.error("[OpenChat] No message text provided");
                return;
            }

            // Get target scope from options or use first installation
            let targetScope: OpenChatScope | undefined;
            let permissions: string[] = [];

            if (options?.scope) {
                targetScope = options.scope;
                const installation = service
                    .getInstallations()
                    .get(`${options.scope.kind}-${options.scope.chatId}`);
                permissions = installation?.permissions || [];
            } else {
                // Use first available installation
                const firstInstallation = Array.from(
                    service.getInstallations().values()
                )[0];
                if (firstInstallation) {
                    targetScope = firstInstallation.scope;
                    permissions = firstInstallation.permissions;
                }
            }

            if (!targetScope) {
                runtime.logger?.error("[OpenChat] No target scope available");
                return;
            }

            // Create client for scope
            const client = service.createClientForScope(
                targetScope,
                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            // Send message (must be finalized)
            const msg = (await client.createTextMessage(messageText)).setFinalised(true);
            await client.sendMessage(msg);

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] Message sent to ${targetScope.kind}: ${targetScope.chatId}`
                );
            }

            if (callback) {
                callback({
                    text: `Message sent to OpenChat ${targetScope.kind}`,
                    content: { success: true },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error sending message:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to send message to OpenChat: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

export default sendMessageAction;
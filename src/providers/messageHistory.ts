import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { OpenChatClientService } from "../services/openchatClient.js";

/**
 * Provider for OpenChat message history
 */
export const messageHistoryProvider: Provider = {
    name: "openchatMessageHistory",
    description: "Provides recent message history from OpenChat chat",

    get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        try {
            const service = (runtime as any).getService?.(
                "openchat"
            ) as OpenChatClientService | undefined;

            if (!service) {
                return { text: "OpenChat: Not connected" };
            }

            const installations = service.getInstallations();

            if (installations.size === 0) {
                return { text: "OpenChat: No message history available" };
            }

            // Try to get history for current room if available
            let targetInstallation;
            if (message.roomId?.startsWith("openchat-")) {
                const parts = (message.roomId as string).split("-");
                const kind = parts[1];
                const chatId = parts[2];
                const scopeKey = `${kind}-${chatId}`;
                targetInstallation = installations.get(scopeKey);
            } else {
                // Use first installation
                targetInstallation = Array.from(installations.values())[0];
            }

            if (!targetInstallation) {
                return { text: "OpenChat: Message history not available" };
            }

            const { scope, permissions } = targetInstallation;

            // Check if we have ReadMessages permission
            if (!permissions.includes("ReadMessages")) {
                return { text: "OpenChat: Missing ReadMessages permission" };
            }

            try {
                const client = service.createClientForScope(
                    scope,
                    runtime.getSetting("OPENCHAT_IC_HOST") || "",
                    permissions
                );

                // Get recent messages (limit to last 10)
                const messages = await client.getMessages({ limit: 10 });

                if (!messages || messages.length === 0) {
                    return { text: "OpenChat: No recent messages" };
                }

                // Format messages for context
                const formattedMessages = messages
                    .reverse() // Show oldest first
                    .map((msg: any) => {
                        const sender = msg.sender || "Unknown";
                        const content = msg.content?.text || "[Media message]";
                        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
                        return `[${timestamp}] ${sender}: ${content}`;
                    })
                    .join("\n");

                return {
                    text: `Recent OpenChat messages:\n${formattedMessages}`,
                    data: messages,
                };
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Could not fetch message history:", error.message);
                return { text: "OpenChat: Error retrieving message history" };
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error getting message history:", error?.message || error);
            return { text: "OpenChat: Error retrieving message history" };
        }
    },
};

export default messageHistoryProvider;

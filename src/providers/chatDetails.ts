import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { OpenChatClientService } from "../services/openchatClient.js";

/**
 * Provider for OpenChat chat details and summary
 */
export const chatDetailsProvider: Provider = {
    name: "openchatChatDetails",
    description: "Provides detailed information about the current OpenChat chat/group/channel",

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
                return { text: "OpenChat: No chat details available" };
            }

            // Try to get details for current room if available
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
                return { text: "OpenChat: Chat details not available" };
            }

            const { scope, permissions } = targetInstallation;

            // Try to get chat details from OpenChat
            try {
                const client = service.createClientForScope(
                    scope,
                    runtime.getSetting("OPENCHAT_IC_HOST") || "",
                    permissions
                );

                // Check if we have ReadChatSummary permission
                if (permissions.includes("ReadChatSummary")) {
                    const summary = await client.getChatSummary();
                    
                    if (summary) {
                        return {
                            text: `OpenChat ${scope.kind} Details:
- Name: ${summary.name || "Unknown"}
- Description: ${summary.description || "N/A"}
- Members: ${summary.memberCount || "Unknown"}
- Type: ${summary.isPublic ? "Public" : "Private"}
- Permissions: ${permissions.join(", ")}`,
                            data: summary,
                        };
                    }
                }

                // Fallback to basic info
                return {
                    text: `OpenChat ${scope.kind} (${scope.chatId})
- Permissions: ${permissions.join(", ")}
- Bot installed: Yes`,
                };
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Could not fetch chat details:", error.message);
                return {
                    text: `OpenChat ${scope.kind} (${scope.chatId})
- Permissions: ${permissions.join(", ")}`,
                };
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error getting chat details:", error?.message || error);
            return { text: "OpenChat: Error retrieving chat details" };
        }
    },
};

export default chatDetailsProvider;

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
 * Action to create a channel in an OpenChat community
 */
export const createChannelAction: Action = {
    name: "CREATE_OPENCHAT_CHANNEL",
    description: "Create a new channel in an OpenChat community",
    similes: [
        "MAKE_CHANNEL_OPENCHAT",
        "ADD_CHANNEL_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Create a new channel called 'Announcements'",
                },
            } as any,
            {
                content: {
                    text: "I'll create that channel.",
                    action: "CREATE_OPENCHAT_CHANNEL",
                },
            } as any,
        ],
    ],

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const service = (runtime as any).getService?.("openchat") as OpenChatClientService | undefined;
            return service !== undefined && service.getInstallations().size > 0;
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

            const channelName = options?.name || options?.channelName;
            const description = options?.description || "";
            const isPublic = options?.isPublic !== false;

            if (!channelName) {
                runtime.logger?.error("[OpenChat] Channel name is required");
                return;
            }

            // Get target community scope
            let targetScope: OpenChatScope | undefined;
            let permissions: string[] = [];

            if (options?.scope) {
                targetScope = options.scope;
                const installation = service
                    .getInstallations()
                    .get(`${options.scope.kind}-${options.scope.chatId}`);
                permissions = installation?.permissions || [];
            } else {
                // Find a community installation
                for (const [key, installation] of service.getInstallations()) {
                    if (installation.scope.communityId) {
                        targetScope = installation.scope;
                        permissions = installation.permissions;
                        break;
                    }
                }
            }

            if (!targetScope || !targetScope.communityId) {
                runtime.logger?.error("[OpenChat] Community scope required for channel creation");
                return;
            }

            const client = service.createClientForScope(
                targetScope,
                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            // Channel creation API (may not be fully supported yet)
            try {
                const result = await (client as any).createChannel({
                    name: channelName,
                    description,
                    isPublic,
                });

                const channelId = (result as any)?.channelId || (result as any)?.chatId;

                if (runtime.logger?.success) {
                    runtime.logger.success(
                        `[OpenChat] Channel '${channelName}' created in community`
                    );
                }

                if (callback) {
                    callback({
                        text: `Channel '${channelName}' created successfully`,
                        content: { success: true, channelName, channelId },
                    });
                }
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Create channel API not fully supported yet:", error.message);
                throw error;
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error creating channel:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to create channel: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

/**
 * Action to delete a channel in an OpenChat community
 */
export const deleteChannelAction: Action = {
    name: "DELETE_OPENCHAT_CHANNEL",
    description: "Delete a channel from an OpenChat community",
    similes: [
        "REMOVE_CHANNEL_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Delete the old announcements channel",
                },
            } as any,
            {
                content: {
                    text: "I'll delete that channel.",
                    action: "DELETE_OPENCHAT_CHANNEL",
                },
            } as any,
        ],
    ],

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const service = (runtime as any).getService?.("openchat") as OpenChatClientService | undefined;
            return service !== undefined && service.getInstallations().size > 0;
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

            const channelId = options?.channelId;

            if (!channelId) {
                runtime.logger?.error("[OpenChat] Channel ID is required");
                return;
            }

            // Get target community scope
            let targetScope: OpenChatScope | undefined;
            let permissions: string[] = [];

            if (options?.scope) {
                targetScope = options.scope;
                const installation = service
                    .getInstallations()
                    .get(`${options.scope.kind}-${options.scope.chatId}`);
                permissions = installation?.permissions || [];
            } else {
                // Find a community installation
                for (const [key, installation] of service.getInstallations()) {
                    if (installation.scope.communityId) {
                        targetScope = installation.scope;
                        permissions = installation.permissions;
                        break;
                    }
                }
            }

            if (!targetScope || !targetScope.communityId) {
                runtime.logger?.error("[OpenChat] Community scope required for channel deletion");
                return;
            }

            const client = service.createClientForScope(
                targetScope,
                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            // Delete channel API (may not be fully supported yet)
            try {
                await (client as any).deleteChannel(channelId);
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Delete channel API not fully supported yet:", error.message);
                throw error;
            }

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] Channel ${channelId} deleted`
                );
            }

            if (callback) {
                callback({
                    text: `Channel deleted successfully`,
                    content: { success: true, channelId },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error deleting channel:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to delete channel: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

// Exported above - no need to re-export

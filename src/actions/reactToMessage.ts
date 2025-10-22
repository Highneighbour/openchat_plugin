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
 * Action to react to a message in OpenChat
 */
export const reactToMessageAction: Action = {
    name: "REACT_TO_OPENCHAT_MESSAGE",
    description: "Add a reaction emoji to a message in OpenChat",
    similes: [
        "ADD_REACTION_ON_OPENCHAT",
        "EMOJI_REACT_OPENCHAT",
        "LIKE_MESSAGE_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "React with a thumbs up to that message",
                },
            } as any,
            {
                content: {
                    text: "I'll add a thumbs up reaction.",
                    action: "REACT_TO_OPENCHAT_MESSAGE",
                },
            } as any,
        ],
    ],

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
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

            // Extract reaction data
            const messageId = options?.messageId || message.content.inReplyTo;
            const reaction = options?.reaction || options?.emoji || "👍";

            if (!messageId) {
                runtime.logger?.error("[OpenChat] Message ID required for reaction");
                return;
            }

            // Get target scope
            let targetScope: OpenChatScope | undefined;
            let permissions: string[] = [];

            if (options?.scope) {
                targetScope = options.scope;
                const installation = service
                    .getInstallations()
                    .get(`${options.scope.kind}-${options.scope.chatId}`);
                permissions = installation?.permissions || [];
            } else {
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

            // Check if we have ReactToMessages permission
            if (!permissions.includes("ReactToMessages")) {
                runtime.logger?.error("[OpenChat] Missing ReactToMessages permission");
                return;
            }

            // Create client for scope
            const client = service.createClientForScope(
                targetScope,
                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            // Add reaction (API may not be fully implemented yet)
            try {
                await (client as any).addReaction(messageId, reaction);
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Reaction API not fully supported yet:", error.message);
                throw error;
            }

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] Reaction ${reaction} added to message ${messageId}`
                );
            }

            if (callback) {
                callback({
                    text: `Reaction ${reaction} added to message`,
                    content: { success: true, reaction, messageId },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error adding reaction:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to add reaction: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

/**
 * Action to remove a reaction from a message in OpenChat
 */
export const removeReactionAction: Action = {
    name: "REMOVE_OPENCHAT_REACTION",
    description: "Remove a reaction from a message in OpenChat",
    similes: [
        "DELETE_REACTION_OPENCHAT",
        "UNREACT_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Remove my thumbs up reaction",
                },
            } as any,
            {
                content: {
                    text: "I'll remove the reaction.",
                    action: "REMOVE_OPENCHAT_REACTION",
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

            const messageId = options?.messageId || message.content.inReplyTo;
            const reaction = options?.reaction || options?.emoji || "👍";

            if (!messageId) {
                runtime.logger?.error("[OpenChat] Message ID required");
                return;
            }

            // Get target scope
            let targetScope: OpenChatScope | undefined;
            let permissions: string[] = [];

            if (options?.scope) {
                targetScope = options.scope;
                const installation = service
                    .getInstallations()
                    .get(`${options.scope.kind}-${options.scope.chatId}`);
                permissions = installation?.permissions || [];
            } else {
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

            const client = service.createClientForScope(
                targetScope,
                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            try {
                await (client as any).removeReaction(messageId, reaction);
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Remove reaction API not fully supported yet:", error.message);
                throw error;
            }

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] Reaction ${reaction} removed from message ${messageId}`
                );
            }

            if (callback) {
                callback({
                    text: `Reaction ${reaction} removed from message`,
                    content: { success: true, reaction, messageId },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error removing reaction:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to remove reaction: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

// Exported above - no need to re-export

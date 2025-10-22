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
 * Action to delete a message in OpenChat (moderation)
 */
export const deleteMessageAction: Action = {
    name: "DELETE_OPENCHAT_MESSAGE",
    description: "Delete a message from OpenChat (requires DeleteMessages permission)",
    similes: [
        "REMOVE_MESSAGE_OPENCHAT",
        "MODERATE_DELETE_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Delete that inappropriate message",
                },
            } as any,
            {
                content: {
                    text: "I'll delete that message.",
                    action: "DELETE_OPENCHAT_MESSAGE",
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

            if (!messageId) {
                runtime.logger?.error("[OpenChat] Message ID required for deletion");
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

            // Check if we have DeleteMessages permission
            if (!permissions.includes("DeleteMessages")) {
                runtime.logger?.error("[OpenChat] Missing DeleteMessages permission");
                if (callback) {
                    callback({
                        text: "I don't have permission to delete messages",
                        content: { error: "Missing permission" },
                    });
                }
                return;
            }

            const client = service.createClientForScope(
                targetScope,
                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            // Use deleteMessages (plural) method
            await (client as any).deleteMessages([messageId]);

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] Message ${messageId} deleted`
                );
            }

            if (callback) {
                callback({
                    text: `Message deleted`,
                    content: { success: true, messageId },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error deleting message:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to delete message: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

/**
 * Action to pin a message in OpenChat
 */
export const pinMessageAction: Action = {
    name: "PIN_OPENCHAT_MESSAGE",
    description: "Pin an important message in OpenChat",
    similes: [
        "STICKY_MESSAGE_OPENCHAT",
        "HIGHLIGHT_MESSAGE_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Pin that announcement",
                },
            } as any,
            {
                content: {
                    text: "I'll pin that message.",
                    action: "PIN_OPENCHAT_MESSAGE",
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

            if (!messageId) {
                runtime.logger?.error("[OpenChat] Message ID required for pinning");
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

            // Check if we have PinMessages permission (may need to be added to schema)
            if (!permissions.includes("PinMessages") && !permissions.includes("UpdateDetails")) {
                runtime.logger?.warn("[OpenChat] May be missing PinMessages permission");
            }

            const client = service.createClientForScope(
                targetScope,
                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            // Pin message API (may not be fully supported yet)
            try {
                await (client as any).pinMessage(messageId);
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Pin message API not fully supported yet:", error.message);
                throw error;
            }

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] Message ${messageId} pinned`
                );
            }

            if (callback) {
                callback({
                    text: `Message pinned`,
                    content: { success: true, messageId },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error pinning message:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to pin message: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

/**
 * Action to unpin a message in OpenChat
 */
export const unpinMessageAction: Action = {
    name: "UNPIN_OPENCHAT_MESSAGE",
    description: "Unpin a message in OpenChat",
    similes: [
        "REMOVE_PIN_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Unpin that old announcement",
                },
            } as any,
            {
                content: {
                    text: "I'll unpin that message.",
                    action: "UNPIN_OPENCHAT_MESSAGE",
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

            if (!messageId) {
                runtime.logger?.error("[OpenChat] Message ID required for unpinning");
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

            // Unpin message API (may not be fully supported yet)
            try {
                await (client as any).unpinMessage(messageId);
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Unpin message API not fully supported yet:", error.message);
                throw error;
            }

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] Message ${messageId} unpinned`
                );
            }

            if (callback) {
                callback({
                    text: `Message unpinned`,
                    content: { success: true, messageId },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error unpinning message:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to unpin message: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

// Exported above - no need to re-export

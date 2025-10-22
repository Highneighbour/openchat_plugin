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
 * Action to invite members to an OpenChat group or community
 */
export const inviteMembersAction: Action = {
    name: "INVITE_OPENCHAT_MEMBERS",
    description: "Invite users to an OpenChat group or community",
    similes: [
        "ADD_MEMBERS_OPENCHAT",
        "INVITE_USERS_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Invite alice to the group",
                },
            } as any,
            {
                content: {
                    text: "I'll invite that user.",
                    action: "INVITE_OPENCHAT_MEMBERS",
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

            const userIds = options?.userIds || options?.users || [];

            if (!Array.isArray(userIds) || userIds.length === 0) {
                runtime.logger?.error("[OpenChat] User IDs required for invitation");
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

            // Check if we have InviteMembers permission
            if (!permissions.includes("InviteMembers")) {
                runtime.logger?.error("[OpenChat] Missing InviteMembers permission");
                if (callback) {
                    callback({
                        text: "I don't have permission to invite members",
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

            // Invite members API (may not be fully supported yet)
            try {
                await (client as any).inviteMembers(userIds);
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Invite members API not fully supported yet:", error.message);
                throw error;
            }

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] ${userIds.length} user(s) invited`
                );
            }

            if (callback) {
                callback({
                    text: `${userIds.length} user(s) invited successfully`,
                    content: { success: true, userIds },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error inviting members:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to invite members: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

/**
 * Action to remove members from an OpenChat group or community
 */
export const removeMembersAction: Action = {
    name: "REMOVE_OPENCHAT_MEMBERS",
    description: "Remove users from an OpenChat group or community",
    similes: [
        "KICK_MEMBERS_OPENCHAT",
        "BAN_USERS_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Remove that spammer from the group",
                },
            } as any,
            {
                content: {
                    text: "I'll remove that user.",
                    action: "REMOVE_OPENCHAT_MEMBERS",
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

            const userIds = options?.userIds || options?.users || [];

            if (!Array.isArray(userIds) || userIds.length === 0) {
                runtime.logger?.error("[OpenChat] User IDs required for removal");
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

            // Check if we have RemoveMembers permission
            if (!permissions.includes("RemoveMembers")) {
                runtime.logger?.error("[OpenChat] Missing RemoveMembers permission");
                if (callback) {
                    callback({
                        text: "I don't have permission to remove members",
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

            // Remove members API (may not be fully supported yet)
            try {
                await (client as any).removeMembers(userIds);
            } catch (error: any) {
                runtime.logger?.warn("[OpenChat] Remove members API not fully supported yet:", error.message);
                throw error;
            }

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] ${userIds.length} user(s) removed`
                );
            }

            if (callback) {
                callback({
                    text: `${userIds.length} user(s) removed successfully`,
                    content: { success: true, userIds },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error removing members:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to remove members: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

// Exported above - no need to re-export

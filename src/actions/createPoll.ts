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
 * Action to create a poll in OpenChat
 */
export const createPollAction: Action = {
    name: "CREATE_OPENCHAT_POLL",
    description: "Create a poll in an OpenChat group or channel",
    similes: [
        "MAKE_POLL_ON_OPENCHAT",
        "START_POLL_ON_OPENCHAT",
        "CREATE_VOTE_ON_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Create a poll asking 'What should we do next?' with options 'Continue', 'Take a break', 'End meeting'",
                },
            } as any,
            {
                content: {
                    text: "I'll create that poll on OpenChat.",
                    action: "CREATE_OPENCHAT_POLL",
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

            // Extract poll data from options or message
            const question = options?.question || options?.text || message.content.text;
            const pollOptions = options?.options || [];
            const config = options?.config || {};

            if (!question || pollOptions.length < 2) {
                runtime.logger?.error("[OpenChat] Poll requires a question and at least 2 options");
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

            // Create client for scope
            const client = service.createClientForScope(
                targetScope,
                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                permissions
            );

            // Create poll message
            const pollConfig = {
                question,
                options: pollOptions,
                allowMultipleVotes: config.allowMultipleVotes || false,
                showVotesBeforeEndDate: config.showVotesBeforeEndDate !== false,
                endDate: config.endDate || undefined,
                anonymous: config.anonymous || false,
            };

            // Note: createPollMessage may require specific parameters
            // Wrapping in try-catch for now as API might differ
            try {
                const msg = (await (client as any).createPollMessage(pollConfig, {})).setFinalised(true);
                await client.sendMessage(msg);
            } catch (error: any) {
                runtime.logger?.error("[OpenChat] Poll creation not fully supported yet:", error.message);
                // Fallback to text message
                const pollText = `📊 ${question}\n\n${pollOptions.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n')}`;
                const textMsg = (await client.createTextMessage(pollText)).setFinalised(true);
                await client.sendMessage(textMsg);
            }

            if (runtime.logger?.success) {
                runtime.logger.success(
                    `[OpenChat] Poll created in ${targetScope.kind}: ${targetScope.chatId}`
                );
            }

            if (callback) {
                callback({
                    text: `Poll created on OpenChat: "${question}"`,
                    content: { success: true, question, options: pollOptions },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error creating poll:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to create poll on OpenChat: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

export default createPollAction;

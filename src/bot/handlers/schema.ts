import { BotDefinition, Permissions } from "@open-ic/openchat-botclient-ts";
import { Request, Response } from "express";
import { IAgentRuntime } from "@elizaos/core";

const emptyPermissions = {
    chat: [],
    community: [],
    message: [],
};

/**
 * Generate bot definition schema based on agent character
 */
function getBotDefinition(runtime: IAgentRuntime): BotDefinition {
    const character = runtime.character;
    const description = character.bio?.[0] || 
        "An AI agent powered by ElizaOS, capable of intelligent conversation and task execution on OpenChat";

    return {
        description,
        autonomous_config: {
            permissions: Permissions.encodePermissions({
                ...emptyPermissions,
                message: ["Text", "Image", "Video", "Audio", "File"],
                chat: [
                    "ReactToMessages",
                    "ReadMessages",
                    "ReadChatSummary",
                    "DeleteMessages",
                ],
            }),
        },
        default_subscriptions: {
            community: [],
            chat: ["Message", "MembersJoined", "MembersLeft"],
        },
        commands: [
            {
                name: "chat",
                default_role: "Participant",
                description: `Chat with ${character.name}`,
                permissions: Permissions.encodePermissions({
                    ...emptyPermissions,
                    message: ["Text"],
                    chat: ["ReadChatSummary"],
                }),
                direct_messages: true,
                params: [
                    {
                        name: "message",
                        required: true,
                        description: "Your message to the agent",
                        placeholder: "Hello! How can you help me?",
                        param_type: {
                            StringParam: {
                                min_length: 1,
                                max_length: 2000,
                                choices: [],
                                multi_line: true,
                            },
                        },
                    },
                ],
            },
            {
                name: "help",
                default_role: "Participant",
                description: "Get information about available commands and capabilities",
                permissions: Permissions.encodePermissions({
                    ...emptyPermissions,
                    message: ["Text"],
                    chat: ["ReadChatSummary"],
                }),
                direct_messages: true,
                params: [],
            },
            {
                name: "info",
                default_role: "Participant",
                description: `Get information about ${character.name}`,
                permissions: Permissions.encodePermissions({
                    ...emptyPermissions,
                    message: ["Text"],
                    chat: ["ReadChatSummary"],
                }),
                direct_messages: true,
                params: [],
            },
            {
                name: "moderate",
                default_role: "Moderator",
                description: "Enable or configure moderation for this chat",
                permissions: Permissions.encodePermissions({
                    ...emptyPermissions,
                    message: ["Text"],
                    chat: ["ReadMessages", "DeleteMessages"],
                }),
                direct_messages: false,
                params: [
                    {
                        name: "action",
                        required: true,
                        description: "Moderation action (enable, disable, status)",
                        placeholder: "enable",
                        param_type: {
                            StringParam: {
                                min_length: 1,
                                max_length: 20,
                                choices: [
                                    { name: "enable", value: "enable" },
                                    { name: "disable", value: "disable" },
                                    { name: "status", value: "status" }
                                ],
                                multi_line: false,
                            },
                        },
                    },
                ],
            },
            {
                name: "poll",
                default_role: "Participant",
                description: "Create a poll in the chat",
                permissions: Permissions.encodePermissions({
                    ...emptyPermissions,
                    message: ["Text", "Poll"],
                    chat: ["ReadChatSummary"],
                }),
                direct_messages: false,
                params: [
                    {
                        name: "question",
                        required: true,
                        description: "Poll question",
                        placeholder: "What should we do next?",
                        param_type: {
                            StringParam: {
                                min_length: 1,
                                max_length: 200,
                                choices: [],
                                multi_line: false,
                            },
                        },
                    },
                    {
                        name: "options",
                        required: true,
                        description: "Poll options (comma-separated)",
                        placeholder: "Option 1, Option 2, Option 3",
                        param_type: {
                            StringParam: {
                                min_length: 1,
                                max_length: 500,
                                choices: [],
                                multi_line: false,
                            },
                        },
                    },
                ],
            },
        ],
    };
}

/**
 * Schema handler - returns bot definition
 */
export function schemaHandler(_: Request, res: Response, runtime: IAgentRuntime) {
    try {
        const definition = getBotDefinition(runtime);
        res.status(200).json(definition);
    } catch (error: any) {
        runtime.logger?.error("Error generating bot definition:", error?.message || error);
        res.status(500).json({ error: "Failed to generate bot definition" });
    }
}

export default schemaHandler;
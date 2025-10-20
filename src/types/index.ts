import { BotClient, BotClientFactory, MessageEvent, TextContent, ImageContent } from "@open-ic/openchat-botclient-ts";
import { Request } from "express";

/**
 * OpenChat Bot Configuration
 */
export interface OpenChatBotConfig {
    /** Private key for bot identity (PEM format) */
    identityPrivateKey: string;
    /** OpenChat public key for JWT verification */
    openchatPublicKey: string;
    /** Internet Computer host URL */
    icHost: string;
    /** OpenChat storage index canister ID */
    openStorageCanisterId: string;
    /** Port for bot server (default: 3000) */
    port?: number;
}

/**
 * Extended Express Request with BotClient
 */
export interface WithBotClient extends Request {
    botClient: BotClient;
}

/**
 * OpenChat Scope Types
 */
export type OpenChatScope = {
    kind: "group" | "channel" | "direct";
    chatId: string;
    communityId?: string;
};

/**
 * OpenChat Message Types
 */
export type OpenChatMessageContent = 
    | { type: "text"; content: string }
    | { type: "image"; url: string; caption?: string }
    | { type: "video"; url: string; caption?: string }
    | { type: "audio"; url: string; caption?: string }
    | { type: "file"; url: string; filename: string }
    | { type: "poll"; question: string; options: string[] }
    | { type: "giphy"; url: string };

/**
 * OpenChat Event Types
 */
export interface OpenChatEvent {
    type: "message" | "reaction" | "member_joined" | "member_left" | "bot_installed" | "bot_uninstalled";
    scope: OpenChatScope;
    timestamp: number;
    data: any;
}

/**
 * OpenChat Bot Installation Event
 */
export interface BotInstallationEvent extends OpenChatEvent {
    type: "bot_installed";
    data: {
        permissions: string[];
        installedBy: string;
    };
}

/**
 * OpenChat Bot Uninstallation Event
 */
export interface BotUninstallationEvent extends OpenChatEvent {
    type: "bot_uninstalled";
    data: {
        uninstalledBy: string;
    };
}

/**
 * OpenChat Message Event
 */
export interface OpenChatMessageEvent extends OpenChatEvent {
    type: "message";
    data: {
        messageId: string;
        sender: string;
        content: OpenChatMessageContent;
        replyTo?: string;
    };
}

/**
 * OpenChat User Info
 */
export interface OpenChatUser {
    userId: string;
    username: string;
    displayName?: string;
    avatar?: string;
}

/**
 * OpenChat Chat Info
 */
export interface OpenChatChatInfo {
    chatId: string;
    name: string;
    description?: string;
    avatar?: string;
    memberCount: number;
    isPublic: boolean;
}

/**
 * OpenChat Command Result
 */
export interface CommandResult {
    success: boolean;
    message?: string;
    error?: string;
}

/**
 * Moderatable Content Types
 */
export type ModeratableContent = MessageEvent<TextContent> | MessageEvent<ImageContent>;

/**
 * OpenChat Action Context
 */
export interface OpenChatActionContext {
    factory: BotClientFactory;
    scope?: OpenChatScope;
    permissions?: string[];
}

export {
    BotClient,
    BotClientFactory,
    MessageEvent,
    TextContent,
    ImageContent
};

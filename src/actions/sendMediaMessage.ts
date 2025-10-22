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
 * Action to send media messages (image, video, audio, file) to OpenChat
 */
export const sendMediaMessageAction: Action = {
    name: "SEND_OPENCHAT_MEDIA",
    description: "Send an image, video, audio file, or document to OpenChat",
    similes: [
        "SEND_IMAGE_TO_OPENCHAT",
        "SEND_VIDEO_TO_OPENCHAT",
        "SEND_AUDIO_TO_OPENCHAT",
        "SEND_FILE_TO_OPENCHAT",
        "SHARE_MEDIA_ON_OPENCHAT",
    ],
    examples: [
        [
            {
                content: {
                    text: "Send this image to OpenChat",
                    attachments: [{ url: "https://example.com/image.png", type: "image" }],
                },
            } as any,
            {
                content: {
                    text: "I'll send that image to OpenChat.",
                    action: "SEND_OPENCHAT_MEDIA",
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
            if (service.getInstallations().size === 0) {
                return false;
            }

            // Check if message has media attachments
            const hasAttachments = message.content.attachments && 
                Array.isArray(message.content.attachments) && 
                message.content.attachments.length > 0;

            return hasAttachments || false;
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

            const attachments = message.content.attachments || [];
            if (attachments.length === 0) {
                runtime.logger?.error("[OpenChat] No media attachments provided");
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

            // Send each attachment
            for (const attachment of attachments as any[]) {
                const url = (attachment as any).url || (attachment as any).contentUrl;
                const caption = message.content.text || (attachment as any).description || "";
                const mimeType = (attachment as any).mimeType || (attachment as any).contentType || "";

                if (!url) {
                    runtime.logger?.warn("[OpenChat] Attachment missing URL, skipping");
                    continue;
                }

                // Determine media type
                let mediaType = (attachment as any).type || mimeType.split("/")[0];
                
                try {
                    let msg;
                    
                    switch (mediaType.toLowerCase()) {
                        case "image":
                            // Image messages: url, width, height, caption
                            msg = (await client.createImageMessage(url, 0, 0, caption)).setFinalised(true);
                            break;
                        case "video":
                        case "audio":
                        case "file":
                        case "document":
                        default:
                            // File messages: blob reference, name, mimeType, caption
                            const filename = (attachment as any).name || (attachment as any).filename || url.split("/").pop() || "file";
                            // Note: For actual file upload, would need to upload to storage first
                            // For now, send as text message with file info
                            const fileMsg = `📎 File: ${filename}\n${caption}`;
                            msg = (await client.createTextMessage(fileMsg)).setFinalised(true);
                            break;
                    }

                    await client.sendMessage(msg);

                    if (runtime.logger?.success) {
                        runtime.logger.success(
                            `[OpenChat] ${mediaType} sent to ${targetScope.kind}: ${targetScope.chatId}`
                        );
                    }
                } catch (error: any) {
                    runtime.logger?.error(
                        `[OpenChat] Error sending ${mediaType}:`,
                        error?.message || error
                    );
                }
            }

            if (callback) {
                callback({
                    text: `Media sent to OpenChat ${targetScope.kind}`,
                    content: { success: true },
                });
            }
        } catch (error: any) {
            runtime.logger?.error("[OpenChat] Error sending media:", error?.message || error);
            if (callback) {
                callback({
                    text: `Failed to send media to OpenChat: ${error?.message || "Unknown error"}`,
                    content: { error: error?.message || "Unknown error" },
                });
            }
        }
    },
};

export default sendMediaMessageAction;

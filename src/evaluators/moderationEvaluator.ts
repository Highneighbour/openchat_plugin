import {
    Evaluator,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { OpenChatClientService } from "../services/openchatClient.js";

/**
 * Content moderation evaluator for OpenChat messages
 * Evaluates messages for inappropriate content and takes action
 */
export const moderationEvaluator: Evaluator = {
    name: "openchatModerationEvaluator",
    description: "Evaluates OpenChat messages for inappropriate content and moderates if necessary",

    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        // Only evaluate messages from OpenChat
        if (message.content.source !== "openchat") {
            return false;
        }

        // Check if moderation is enabled
        const moderationEnabled = runtime.getSetting("OPENCHAT_MODERATION_ENABLED") === "true";
        return moderationEnabled;
    },

    handler: async (runtime: IAgentRuntime, message: Memory): Promise<any> => {
        try {
            const service = (runtime as any).getService("openchat") as OpenChatClientService;

            if (!service) {
                return null;
            }

            const text = message.content.text || "";
            
            // Check for spam patterns
            const isSpam = checkForSpam(text);
            
            // Check for inappropriate content
            const isInappropriate = await checkInappropriateContent(runtime, text);
            
            // Check for excessive caps
            const isExcessiveCaps = checkExcessiveCaps(text);

            const violations = [];
            if (isSpam) violations.push("spam");
            if (isInappropriate) violations.push("inappropriate_content");
            if (isExcessiveCaps) violations.push("excessive_caps");

            if (violations.length > 0) {
                runtime.logger?.warn(
                    `[OpenChat Moderation] Message flagged: ${violations.join(", ")}`
                );

                // Get moderation action from settings
                const moderationAction = runtime.getSetting("OPENCHAT_MODERATION_ACTION") || "warn";

                if (moderationAction === "delete") {
                    // Delete the message if we have permission
                    const messageId = (message as any).openchatMessageId;
                    if (messageId) {
                        try {
                            // Find the scope for this message
                            const roomId = message.roomId as string;
                            if (roomId?.startsWith("openchat-")) {
                                const parts = roomId.split("-");
                                const kind = parts[1];
                                const chatId = parts[2];
                                const scopeKey = `${kind}-${chatId}`;
                                
                                const installation = service.getInstallations().get(scopeKey);
                                
                                if (installation && installation.permissions.includes("DeleteMessages")) {
                                    const client = service.createClientForScope(
                                        installation.scope,
                                        runtime.getSetting("OPENCHAT_IC_HOST") || "",
                                        installation.permissions
                                    );
                                    
                                    await (client as any).deleteMessages([messageId]);
                                    runtime.logger?.success("[OpenChat Moderation] Inappropriate message deleted");
                                }
                            }
                        } catch (error: any) {
                            runtime.logger?.error("[OpenChat Moderation] Failed to delete message:", error.message);
                        }
                    }
                } else if (moderationAction === "warn") {
                    // Send a warning message
                    const roomId = message.roomId as string;
                    if (roomId?.startsWith("openchat-")) {
                        const parts = roomId.split("-");
                        const kind = parts[1];
                        const chatId = parts[2];
                        const scopeKey = `${kind}-${chatId}`;
                        
                        const installation = service.getInstallations().get(scopeKey);
                        
                        if (installation && installation.permissions.includes("SendMessages")) {
                            const client = service.createClientForScope(
                                installation.scope,
                                runtime.getSetting("OPENCHAT_IC_HOST") || "",
                                installation.permissions
                            );
                            
                            const warningText = `⚠️ Warning: Your message was flagged for ${violations.join(", ")}. Please follow community guidelines.`;
                            const msg = (await client.createTextMessage(warningText)).setFinalised(true);
                            await client.sendMessage(msg);
                        }
                    }
                }

                return {
                    flagged: true,
                    violations,
                    action: moderationAction,
                };
            }

            return {
                flagged: false,
                violations: [],
            };
        } catch (error: any) {
            runtime.logger?.error("[OpenChat Moderation] Error evaluating message:", error?.message || error);
            return null;
        }
    },

    examples: [
        {
            context: "Message contains spam links",
            expected: { flagged: true, violations: ["spam"] },
        },
        {
            context: "Message is appropriate",
            expected: { flagged: false, violations: [] },
        },
    ],
};

/**
 * Check for spam patterns in text
 */
function checkForSpam(text: string): boolean {
    const spamPatterns = [
        /https?:\/\/bit\.ly/i,
        /click here/i,
        /earn \$\d+/i,
        /free money/i,
        /limited time offer/i,
        /act now/i,
        /winners?.*selected/i,
        /claim.*prize/i,
    ];

    return spamPatterns.some(pattern => pattern.test(text));
}

/**
 * Check for inappropriate content
 */
async function checkInappropriateContent(runtime: IAgentRuntime, text: string): Promise<boolean> {
    // Simple keyword-based check
    const inappropriateKeywords = runtime.getSetting("OPENCHAT_MODERATION_KEYWORDS")?.split(",") || [];
    
    const lowerText = text.toLowerCase();
    return inappropriateKeywords.some(keyword => lowerText.includes(keyword.trim().toLowerCase()));
}

/**
 * Check for excessive caps (shouting)
 */
function checkExcessiveCaps(text: string): boolean {
    if (text.length < 10) return false;
    
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (letterCount === 0) return false;
    
    const capsRatio = capsCount / letterCount;
    return capsRatio > 0.7; // More than 70% caps
}

export default moderationEvaluator;

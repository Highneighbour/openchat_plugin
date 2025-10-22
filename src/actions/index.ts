export { sendMessageAction } from "./sendMessage.js";
export { sendMediaMessageAction } from "./sendMediaMessage.js";
export { createPollAction } from "./createPoll.js";
export { reactToMessageAction, removeReactionAction } from "./reactToMessage.js";
export { deleteMessageAction, pinMessageAction, unpinMessageAction } from "./moderateMessage.js";
export { createChannelAction, deleteChannelAction } from "./channelManagement.js";
export { inviteMembersAction, removeMembersAction } from "./memberManagement.js";

// Export all actions as array for plugin registration
import { sendMessageAction } from "./sendMessage.js";
import { sendMediaMessageAction } from "./sendMediaMessage.js";
import { createPollAction } from "./createPoll.js";
import { reactToMessageAction, removeReactionAction } from "./reactToMessage.js";
import { deleteMessageAction, pinMessageAction, unpinMessageAction } from "./moderateMessage.js";
import { createChannelAction, deleteChannelAction } from "./channelManagement.js";
import { inviteMembersAction, removeMembersAction } from "./memberManagement.js";

export const actions = [
    sendMessageAction,
    sendMediaMessageAction,
    createPollAction,
    reactToMessageAction,
    removeReactionAction,
    deleteMessageAction,
    pinMessageAction,
    unpinMessageAction,
    createChannelAction,
    deleteChannelAction,
    inviteMembersAction,
    removeMembersAction,
];

export default actions;

export { sendMessageAction } from "./sendMessage.js";

// Export all actions as array for plugin registration
import { sendMessageAction } from "./sendMessage.js";

export const actions = [sendMessageAction];

export default actions;

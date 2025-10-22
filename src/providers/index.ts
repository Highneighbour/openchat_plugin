export { chatContextProvider } from "./chatContext.js";
export { chatDetailsProvider } from "./chatDetails.js";
export { messageHistoryProvider } from "./messageHistory.js";

// Export all providers as array for plugin registration
import { chatContextProvider } from "./chatContext.js";
import { chatDetailsProvider } from "./chatDetails.js";
import { messageHistoryProvider } from "./messageHistory.js";

export const providers = [
    chatContextProvider,
    chatDetailsProvider,
    messageHistoryProvider,
];

export default providers;

export { chatContextProvider } from "./chatContext.js";

// Export all providers as array for plugin registration
import { chatContextProvider } from "./chatContext.js";

export const providers = [chatContextProvider];

export default providers;

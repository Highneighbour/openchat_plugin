export { moderationEvaluator } from "./moderationEvaluator.js";

// Export all evaluators as array for plugin registration
import { moderationEvaluator } from "./moderationEvaluator.js";

export const evaluators = [moderationEvaluator];

export default evaluators;

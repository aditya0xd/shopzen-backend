const z = require("zod");

const sendMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty"),
    toolName: z.string().optional(), // For future tool calls
});

module.exports = {
    sendMessageSchema,
};

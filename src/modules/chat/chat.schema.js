const z = require("zod");

const sendMessageSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Message cannot be empty")
        .max(2000, "Message is too long (max 2000 characters)"),
    toolName: z.string().optional(),
});

module.exports = {
    sendMessageSchema,
};

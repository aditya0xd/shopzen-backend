const {
    processUserMessage,
    getConversationHistory,
    clearHistory,
} = require("./chat.service");

const { sendMessageSchema } = require("./chat.schema");

const getValidationErrorMessage = (zodError) => {
    return zodError?.issues?.[0]?.message || "Invalid request data";
};

/**
 * Handle new user message
 * POST /api/v1/chat
 */
const sendMessage = async (req, res) => {
    const result = sendMessageSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: getValidationErrorMessage(result.error),
        });
    }

    const { content } = result.data;
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const response = await processUserMessage(userId, content);
        return res.status(200).json(response);
    } catch (error) {
        console.error("Chat sendMessage error:", error);
        return res.status(500).json({ error: "Failed to process message" });
    }
};

/**
 * Get chat history
 * GET /api/v1/chat/history
 */
const getHistory = async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const history = await getConversationHistory(userId);
        return res.status(200).json(history);
    } catch (error) {
        console.error("Chat getHistory error:", error);
        return res.status(500).json({ error: "Failed to fetch history" });
    }
};

/**
 * Clear chat history
 * DELETE /api/v1/chat/history
 */
const deleteHistory = async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        await clearHistory(userId);
        return res.status(200).json({ message: "History cleared" });
    } catch (error) {
        console.error("Chat deleteHistory error:", error);
        return res.status(500).json({ error: "Failed to clear history" });
    }
};

module.exports = {
    sendMessage,
    getHistory,
    deleteHistory,
};

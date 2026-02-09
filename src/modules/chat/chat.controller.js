const {
    getOrCreateConversation,
    processUserMessage,
    getConversationHistory,
    clearHistory
} = require("./chat.service");

const { sendMessageSchema } = require("./chat.schema");

const { z } = require("zod");

/**
 * Handle new user message
 * POST /api/v1/chat
 */
const sendMessage = async (req, res) => {
    const result = sendMessageSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { content } = result.data;
    const userId = req.user.userId;

    try {
        const response = await processUserMessage(userId, content);
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to process message" });
    }
};

/**
 * Get chat history
 * GET /api/v1/chat/history
 */
const getHistory = async (req, res) => {
    const userId = req.user.userId;

    try {
        const history = await getConversationHistory(userId);
        res.status(200).json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};

/**
 * Clear chat history
 * DELETE /api/v1/chat/history
 */
const deleteHistory = async (req, res) => {
    const userId = req.user.userId;

    try {
        await clearHistory(userId);
        res.status(200).json({ message: "History cleared" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to clear history" });
    }
};

module.exports = {
    sendMessage,
    getHistory,
    deleteHistory
};

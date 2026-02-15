const prisma = require("../../utils/prisma");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { toolsDefinition, toolsImplementation } = require("./chat.tools");

const SHUT_DOWN_MODELS = new Set([
    // "gemini-1.0-pro", // Example of a potentially deprecated model
]);
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest"; // Fallback to "gemini-2.5-flash-lite" if needed
const GENERIC_ERROR_TEXT = "I encountered an error processing your request. Please try again.";
const MAX_CONTEXT_MESSAGES = 10;
const MAX_TOOL_CALL_ROUNDS = 5;
const SUMMARY_MAX_CHARS = 1200;

const hasGeminiKey = () => {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
};

const getGeminiModelName = () => {
    const configured = process.env.GEMINI_MODEL?.trim();
    if (!configured) {
        return DEFAULT_GEMINI_MODEL;
    }

    if (SHUT_DOWN_MODELS.has(configured)) {
        console.warn(
            `Configured GEMINI_MODEL "${configured}" is shut down. Falling back to "${DEFAULT_GEMINI_MODEL}".`
        );
        return DEFAULT_GEMINI_MODEL;
    }

    return configured;
};

const getChatModel = () => {
    if (!hasGeminiKey()) {
        return null;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    return genAI.getGenerativeModel({
        model: getGeminiModelName(),
        tools: toolsDefinition,
    });
};

const mapDbRoleToGeminiRole = (role) => {
    return role === "USER" ? "user" : "model";
};

const buildSummary = (messages) => {
    if (!messages || messages.length === 0) {
        return null;
    }

    const recentMessages = messages.slice(-8);
    const lines = [];

    for (const msg of recentMessages) {
        // ignore the generic failure text when summarizing
        if (msg.role === "ASSISTANT" && msg.content === GENERIC_ERROR_TEXT) {
            continue;
        }

        const content = String(msg.content || "").replace(/\s+/g, " ").trim();
        if (!content) {
            continue;
        }

        const speaker = msg.role === "USER" ? "User" : "Assistant";
        lines.push(`- ${speaker}: ${content}`);
    }

    if (lines.length === 0) {
        return null;
    }

    const summary = `Previous context:\n${lines.join("\n")}`;
    if (summary.length <= SUMMARY_MAX_CHARS) {
        return summary;
    }

    return `${summary.slice(0, SUMMARY_MAX_CHARS)}...`;
};

/**
 * Get or create conversation for user
 */
const getOrCreateConversation = async (userId) => {
    let conversation = await prisma.aIConversation.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: {
            messages: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!conversation) {
        conversation = await prisma.aIConversation.create({
            data: { userId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    }

    return conversation;
};

/**
 * Build context history and maintain compact summary for older messages
 */
const getContextWithSummary = async (conversation) => {
    // keep the raw sequence for summary generation, but only send cleaned
    // messages (without our generic error replies) to Gemini's history.
    const originalMessages = conversation.messages;
    const filteredMessages = originalMessages.filter(
        (msg) => !(msg.role === "ASSISTANT" && msg.content === GENERIC_ERROR_TEXT)
    );

    // always attempt to regenerate the summary from filtered history; this
    // ensures stale summaries containing the error text are overwritten.
    const generatedSummary = buildSummary(
        originalMessages.filter(
            (msg) => !(msg.role === "ASSISTANT" && msg.content === GENERIC_ERROR_TEXT)
        )
    );
    let summaryText = conversation.summary;

    if (generatedSummary && generatedSummary !== conversation.summary) {
        try {
            await prisma.aIConversation.update({
                where: { id: conversation.id },
                data: { summary: generatedSummary },
            });
            summaryText = generatedSummary;
        } catch (error) {
            console.warn("Failed to persist chat summary:", error.message);
            summaryText = generatedSummary;
        }
    }

    let history;
    if (filteredMessages.length <= MAX_CONTEXT_MESSAGES) {
        history = filteredMessages.map((msg) => ({
            role: mapDbRoleToGeminiRole(msg.role),
            parts: [{ text: msg.content }],
        }));
    } else {
        const recentMessages = filteredMessages.slice(-MAX_CONTEXT_MESSAGES);
        history = recentMessages.map((msg) => ({
            role: mapDbRoleToGeminiRole(msg.role),
            parts: [{ text: msg.content }],
        }));
    }

    if (summaryText) {
        // always push the summary as a user role at the front for validation
        history.unshift({
            role: "user",
            parts: [{ text: summaryText }],
        });
    }

    return history;
};

/**
 * Execute tool calls from Gemini
 */
const executeToolCalls = async (functionCalls, userId) => {
    const results = [];

    for (const call of functionCalls) {
        const fnName = call?.name;
        const args = call?.args || {};

        let result;

        if (fnName && toolsImplementation[fnName]) {
            try {
                if (fnName === "getOrderStatus") {
                    result = await toolsImplementation[fnName](args, userId);
                } else {
                    result = await toolsImplementation[fnName](args);
                }
            } catch (error) {
                result = { error: error.message || "Tool execution failed" };
            }
        } else {
            result = { error: `Function ${fnName || "unknown"} not found` };
        }

        results.push({
            functionResponse: {
                name: fnName || "unknown",
                response: { result },
            },
        });
    }

    return results;
};

/**
 * Add user message and process conversation with Gemini tools
 */
const processUserMessage = async (userId, content) => {
    const conversation = await getOrCreateConversation(userId);

    await prisma.aIMessage.create({
        data: {
            conversationId: conversation.id,
            role: "USER",
            content,
        },
    });

    let aiFinalResponseText = "";

    try {
        const model = getChatModel();

        if (model) {
            const history = await getContextWithSummary(conversation);
            const chat = model.startChat({
                history,
                generationConfig: {
                    maxOutputTokens: 1000,
                },
                systemInstruction: {
                    role: "system",
                    parts: [
                        {
                            text: "You are the ShopZen AI assistant. Use tools for product and order data requests. If a user is frustrated or needs human help, call escalateToHuman. Keep responses concise and helpful.",
                        },
                    ],
                },
            });

            let result = await chat.sendMessage(content);
            let response = await result.response;
            let functionCalls = response.functionCalls?.() || [];
            let toolCallRound = 0;

            while (functionCalls.length > 0) {
                toolCallRound += 1;

                if (toolCallRound > MAX_TOOL_CALL_ROUNDS) {
                    aiFinalResponseText = "I could not finish processing that request. Please try again with a simpler query.";
                    break;
                }

                const functionResponses = await executeToolCalls(functionCalls, userId);
                result = await chat.sendMessage(functionResponses);
                response = await result.response;
                functionCalls = response.functionCalls?.() || [];
            }

            if (!aiFinalResponseText) {
                aiFinalResponseText = response.text?.() || "I could not generate a response.";
            }
        } else {
            aiFinalResponseText = `(Mock AI) I received: "${content}". Configure GEMINI_API_KEY to enable live AI tools.`;
        }
    } catch (error) {
        console.error("Gemini AI error:", error);
        aiFinalResponseText = "I encountered an error processing your request. Please try again.";
    }

    // Only persist real AI output; skip the generic error text to avoid
    // seeding the conversation with it and creating a loop.
    let assistantMessage;
    if (aiFinalResponseText === GENERIC_ERROR_TEXT) {
        console.warn('Skipping storage of generic AI error message');
    } else {
        assistantMessage = await prisma.aIMessage.create({
            data: {
                conversationId: conversation.id,
                role: "ASSISTANT",
                content: aiFinalResponseText,
            },
        });
    }

    return {
        userMessage: { role: "USER", content },
        assistantMessage,
    };
};

/**
 * Get conversation history for user
 */
const getConversationHistory = async (userId) => {
    const conversations = await prisma.aIConversation.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: {
            messages: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (conversations.length === 0) {
        return [];
    }

    const messages = conversations.flatMap((conversation) => conversation.messages);
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return messages;
};

/**
 * Clear conversation history for user
 */
const clearHistory = async (userId) => {
    const conversations = await prisma.aIConversation.findMany({
        where: { userId },
        select: { id: true },
    });

    if (conversations.length === 0) {
        return { message: "History cleared" };
    }

    const conversationIds = conversations.map((conversation) => conversation.id);

    await prisma.aIMessage.deleteMany({
        where: {
            conversationId: {
                in: conversationIds,
            },
        },
    });

    await prisma.aIConversation.updateMany({
        where: {
            id: {
                in: conversationIds,
            },
        },
        data: { summary: null },
    });

    return { message: "History cleared" };
};

module.exports = {
    getOrCreateConversation,
    processUserMessage,
    getConversationHistory,
    clearHistory,
    // helpers exported for testing/debugging
    getChatModel,
    getContextWithSummary,
};

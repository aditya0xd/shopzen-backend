const prisma = require("../../utils/prisma");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { toolsDefinition, toolsImplementation } = require("./chat.tools");

// Initialize Google AI
// Get your free API key from https://aistudio.google.com/
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "mock_key");

// Define model with tools (function calling)
// 'gemini-1.5-flash-latest' or 'gemini-1.5-flash' usually supports tools
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: toolsDefinition
});

/**
 * Get or create conversation for user
 */
const getOrCreateConversation = async (userId) => {
    let conversation = await prisma.aIConversation.findFirst({
        where: { userId },
        include: {
            messages: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!conversation) {
        conversation = await prisma.aIConversation.create({
            data: { userId },
            include: { messages: true },
        });
    }

    return conversation;
};

/**
 * Summarize conversation
 * Takes the old messages, asks LLM to summarize, and updates conversation.summary
 * Returns the "compressed" history context.
 */
const getContextWithSummary = async (conversation) => {
    const MAX_CONTEXT_MESSAGES = 10;

    const allMessages = conversation.messages;

    // If short, return full history
    if (allMessages.length <= MAX_CONTEXT_MESSAGES) {
        const history = allMessages.map((msg) => ({
            role: msg.role === "USER" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));
        // Prepend existing summary if any
        if (conversation.summary) {
            history.unshift({ role: "model", parts: [{ text: `(Memory Summary: ${conversation.summary})` }] });
        }
        return history;
    }

    // If long, summarize older messages
    // We keep the last N messages + summary of the rest
    const recentMessages = allMessages.slice(-MAX_CONTEXT_MESSAGES);
    const olderMessages = allMessages.slice(0, -MAX_CONTEXT_MESSAGES);

    // In a real advanced implementation, we would call an LLM here to generate a new summary
    // based on (conversation.summary + olderMessages).
    // For now, we'll mock the summarization trigger or just truncate older history 
    // and rely on existing summary if we had a background job.

    // Let's just return the sliced history + summary note for efficiency
    // Correct implementation would involve an async summary update.

    const history = recentMessages.map((msg) => ({
        role: msg.role === "USER" ? "user" : "model",
        parts: [{ text: msg.content }],
    }));

    if (conversation.summary) {
        // Inject summary as a system-like message or first model message
        history.unshift({ role: "model", parts: [{ text: `(Context Summary: ${conversation.summary})` }] });
    }

    return history;
};

/**
 * Execute Tool Calls
 */
const executeToolCalls = async (functionCalls, userId) => {
    const results = [];

    for (const call of functionCalls) {
        const fnName = call.name;
        const args = call.args;

        let result;

        if (toolsImplementation[fnName]) {
            try {
                // Inject userId for secure tools (like getOrderStatus)
                // We pass arguments and the secure context (userId)
                if (fnName === "getOrderStatus") {
                    result = await toolsImplementation[fnName](args, userId);
                } else {
                    result = await toolsImplementation[fnName](args);
                }
            } catch (err) {
                result = { error: err.message };
            }
        } else {
            result = { error: `Function ${fnName} not found` };
        }

        results.push({
            functionResponse: {
                name: fnName,
                response: { result: result }
            }
        });
    }

    return results;
};

/**
 * Add user message and process conversation with tools
 */
const processUserMessage = async (userId, content) => {
    const conversation = await getOrCreateConversation(userId);

    // 1. Save User Message
    await prisma.aIMessage.create({
        data: {
            conversationId: conversation.id,
            role: "USER",
            content,
        },
    });

    // Re-fetch conversation to get latest message if needed, or just append locally
    // But we have the conversation object from before.
    // We need to add the new message to our *local* history for the chat session context.

    let aiFinalResponseText = "";

    try {
        if (process.env.GEMINI_API_KEY) {
            // 2. Prepare History (with summarization logic)
            const history = await getContextWithSummary(conversation);

            // Start Chat Session
            const chat = model.startChat({
                history: history,
                generationConfig: {
                    maxOutputTokens: 1000,
                },
                systemInstruction: {
                    role: "system",
                    parts: [{ text: "You are the advanced AI assistant for ShopZen. You have access to tools to search products and check order status. Always use tools when the user asks for data. If you use a tool, answer based on the tool's output. If the user is angry, escalate. Be concise." }]
                }
            });

            // 3. Send Message & Handle Function Calls loop
            // Gemini SDK handles the multi-turn function calling conveniently 
            // if we follow the pattern: sendMessage -> response.functionCalls -> sendMessage(functionResponse)

            let result = await chat.sendMessage(content);
            let response = await result.response;
            let functionCalls = response.functionCalls();

            // If the model wants to call functions
            while (functionCalls && functionCalls.length > 0) {
                console.log("Gemini requested tool execution:", functionCalls);

                // Execute tools
                const functionResponses = await executeToolCalls(functionCalls, userId);

                // Send tool outputs back to model
                // Format: [ { functionResponse: { name, response } } ]
                result = await chat.sendMessage(functionResponses);
                response = await result.response;
                functionCalls = response.functionCalls(); // Check if it wants to call more tools
            }

            aiFinalResponseText = response.text();

        } else {
            console.warn("⚠️ GEMINI_API_KEY missing. Using mock response.");
            aiFinalResponseText = `(Mock AI) I received: "${content}". Configure GEMINI_API_KEY to enable tools like product search.`;
        }
    } catch (error) {
        console.error("Gemini AI Error:", error);
        aiFinalResponseText = "I encountered an error processing your request. Please try again.";
    }

    // 4. Save Assistant Message
    const assistantMessage = await prisma.aIMessage.create({
        data: {
            conversationId: conversation.id,
            role: "ASSISTANT",
            content: aiFinalResponseText,
        },
    });

    // 5. Update Conversation Summary (Simulated background task)
    // If history length > 20, we would ideally trigger a summary update here.

    return {
        userMessage: { role: "USER", content },
        assistantMessage,
    };
};

/**
 * Get conversation history
 */
const getConversationHistory = async (userId) => {
    const conversation = await prisma.aIConversation.findFirst({
        where: { userId },
        include: {
            messages: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!conversation) {
        return [];
    }

    return conversation.messages;
};

/**
 * Clear conversation history
 */
const clearHistory = async (userId) => {
    const conversation = await prisma.aIConversation.findFirst({
        where: { userId },
    });

    if (conversation) {
        // Delete messages
        await prisma.aIMessage.deleteMany({
            where: { conversationId: conversation.id },
        });
        // Reset summary
        await prisma.aIConversation.update({
            where: { id: conversation.id },
            data: { summary: null }
        });
    }

    return { message: "History cleared" };
};

module.exports = {
    getOrCreateConversation,
    processUserMessage,
    getConversationHistory,
    clearHistory,
};

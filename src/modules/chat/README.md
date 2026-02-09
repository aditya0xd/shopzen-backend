# AI Chat API Documentation

## Overview
The Chat API enables users to converse with an AI assistant with persisted message history stored in the database.

**Current Status:** The API stores and retrieves messages. Advanced features (tool calling, data grounding, memory summarization, escalation logic) are **fully implemented in code** but require `GEMINI_API_KEY` configuration to activate. Without the API key, the system returns mock responses.

## Architecture
- **AIConversation**: Represents a chat session for each user, with optional summary field for long conversations.
- **AIMessage**: Individual messages stored with role (USER/ASSISTANT/SYSTEM/TOOL) and content.
- **AI Integration**: Uses Google Gemini (`gemini-1.5-flash`) with function calling enabled (when API key is configured).
- **Tools**: Three integrated functions that the AI can call to interact with the system.

## Advanced Features (Requires API Key)

The following capabilities are **implemented and ready to use** once you configure `GEMINI_API_KEY`:

1.  **Function Calling (Tools)**: The AI can initiate actions using three tools:
    - `searchProducts`: Search the product catalog based on query strings
    - `getOrderStatus`: Retrieve order status and details  
    - `escalateToHuman`: Escalate complex or frustrated users to human support

2.  **Verified Data Injection**: When tools are called, the system executes them securely:
    - The `getOrderStatus` tool verifies that `userId` matches the order owner before returning data
    - Real database results from Prisma are injected back into the conversation context
    - The AI uses actual data (not hallucinations) to respond to users

3.  **Memory Summarization**: The system manages context efficiently:
    - Conversations with ≤10 messages use full history
    - Longer conversations use the last 10 messages + a summary of older messages
    - Summary is prepended to context to maintain continuity
    - Prevents exceeding token limits on very long conversations

4.  **Escalation Logic**: The AI can detect frustration and call the `escalateToHuman` tool:
    - Logs escalation reason for human review
    - In production, would trigger notifications/tickets
    - Currently returns confirmation message to user

5.  **Safety Instructions**: System prompt guides the AI to:
    - Use tools when users ask for data
    - Answer based on tool outputs (grounded responses)
    - Escalate when detecting user frustration
    - Provide concise, helpful responses

## API Endpoints

### 1. Send Message
**POST** `/api/v1/chat`

Sends a message to the AI.

**Request Body:**
```json
{
  "content": "Hello, can you help me find shoes?"
}
```

**Response:**
```json
{
  "userMessage": {
    "role": "USER",
    "content": "Hello, can you help me find shoes?"
  },
  "assistantMessage": {
    "id": "uuid...",
    "role": "ASSISTANT",
    "content": "I received your message..."
  }
}
```

### 2. Get History
**GET** `/api/v1/chat/history`

Retrieves the full conversation history for the authenticated user.

### 3. Clear History
**DELETE** `/api/v1/chat/history`

Deletes all messages in the user's conversation.

⚠️ **Warning:** This action permanently deletes all conversation history and cannot be undone.

## Integration
This module uses **Google Gemini (gemini-1.5-flash)**, which offers a generous free tier.

⚠️ **Important:** Without `GEMINI_API_KEY`, the API will only return mock responses. All advanced features (tools, memory, escalation) require the API key to function.

**Setup:**
1. Get a **Free API Key** from [Google AI Studio](https://aistudio.google.com/).
2. Add it to your `.env` file:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
3. Restart your server to activate advanced AI features.

The `processUserMessage` function in `src/modules/chat/chat.service.js` automatically uses this key to generate responses. If the key is missing, it returns a mock response.

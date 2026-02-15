# AI Chat API Documentation

## Overview
The Chat API lets authenticated users talk to an AI assistant with conversation history stored in the database.

Current behavior:
- With `GEMINI_API_KEY` configured: uses Google Gemini with tool calling.
- Without `GEMINI_API_KEY`: returns a mock assistant response so frontend flows still work.

## Authentication
All chat endpoints require a Bearer token:

```http
Authorization: Bearer <access_token>
```

## Architecture
- `AIConversation`: conversation container for a user, with optional `summary`.
- `AIMessage`: message records with role (`USER`, `ASSISTANT`, `SYSTEM`, `TOOL`) and content.
- `chat.service.js`: handles context building, Gemini calls, tool execution, and persistence.
- `chat.tools.js`: tool definitions and secure implementations.

## AI Features (when `GEMINI_API_KEY` is set)
1. Function calling with tools:
   - `searchProducts`
   - `getOrderStatus`
   - `escalateToHuman`
2. Grounded responses using tool outputs from Prisma queries.
3. Context management:
   - Up to 10 recent messages are sent directly.
   - Older messages are compressed into a stored conversation summary.
4. Safety/runtime controls:
   - Tool-call loop is capped to avoid runaway calls.
   - Short, support-focused system instruction is applied.

## API Endpoints

### 1) Send Message
`POST /api/v1/chat`

Request body:
```json
{
  "content": "Hello, can you help me find shoes?"
}
```

Validation:
- `content` is required.
- `content` is trimmed.
- Length: `1..2000` characters.

Success response (`200`):
```json
{
  "userMessage": {
    "role": "USER",
    "content": "Hello, can you help me find shoes?"
  },
  "assistantMessage": {
    "id": "uuid...",
    "role": "ASSISTANT",
    "content": "..."
  }
}
```

Common errors:
- `400` invalid payload
- `401` unauthorized
- `500` processing failure

### 2) Get History
`GET /api/v1/chat/history`

Returns all stored messages for the authenticated user.

Common errors:
- `401` unauthorized
- `500` fetch failure

### 3) Clear History
`DELETE /api/v1/chat/history`

Deletes all chat messages for the authenticated user and resets stored summaries.

Common errors:
- `401` unauthorized
- `500` clear failure

## Setup
1. Get an API key from Google AI Studio: <https://aistudio.google.com/>
2. Add to `.env`:

```env
GEMINI_API_KEY="your_api_key_here"
```

3. Restart the backend.

Optional model override:

```env
GEMINI_MODEL="gemini-1.5-flash"
```
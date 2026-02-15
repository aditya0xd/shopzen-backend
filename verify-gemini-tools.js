
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const toolsDefinition = [
    {
        functionDeclarations: [
            {
                name: "get_weather",
                description: "Get the weather for a location",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        location: { type: "STRING", description: "City and state" },
                    },
                    required: ["location"],
                },
            },
        ],
    },
];

async function verifyTools() {
    const fs = require('fs');
    let outputLog = "";
    const log = (msg) => { console.log(msg); outputLog += msg + "\n"; };

    if (!process.env.GEMINI_API_KEY) {
        log("❌ GEMINI_API_KEY is missing");
        fs.writeFileSync('tool_output_node.txt', outputLog);
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = "gemini-flash-latest";
    log(`Testing tools on model: ${modelName}...`);

    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            tools: toolsDefinition,
        });

        const chat = model.startChat();
        const msg = "I need the weather for New York, NY. Please use the get_weather tool.";
        log(`Sending: ${msg}`);
        const result = await chat.sendMessage(msg);
        const response = await result.response;

        try {
            const functionCalls = response.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
                log("✅ Tool call received:");
                log(JSON.stringify(functionCalls, null, 2));
            } else {
                log("⚠️ No tool call received. Response text: " + response.text());
            }
        } catch (fcError) {
            log(`❌ Error parsing function calls: ${fcError.message}`);
            log(`Full response candidates: ${JSON.stringify(response.candidates, null, 2)}`);
        }

    } catch (error) {
        log(`❌ Failed: ${error.message}`);
        if (error.response) log(`Response: ${JSON.stringify(error.response)}`);
    }
    fs.writeFileSync('tool_output_node.txt', outputLog);
}

verifyTools();

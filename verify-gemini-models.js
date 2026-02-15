
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function verifyGemini() {
    let output = "";
    const log = (msg) => {
        console.log(msg);
        output += msg + "\n";
    };

    if (!process.env.GEMINI_API_KEY) {
        log("❌ GEMINI_API_KEY is missing in .env");
        fs.writeFileSync('gemini_test_output.txt', output);
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Try gemini-1.5-flash which is widely supported
        const modelName = "gemini-1.5-flash";
        log(`Testing model: ${modelName}...`);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello!");
        const response = await result.response;

        log(`✅ Success! Response: ${response.text()}`);
    } catch (error) {
        log(`❌ Failed. Error: ${error.name}: ${error.message}`);
        if (error.response) {
            log(`Response status: ${error.response.status}`);
            log(`Response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    fs.writeFileSync('gemini_test_output.txt', output);
}

verifyGemini();

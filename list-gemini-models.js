
require('dotenv').config();
const https = require('https');
const fs = require('fs');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            const response = JSON.parse(data);
            let output = "Available models:\n";
            console.log("Available models:");
            const models = response.models || [];
            models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name}`);
                    output += `- ${m.name}\n`;
                }
            });
            fs.writeFileSync('available_models.txt', output);
            if (models.length === 0) {
                console.log("No models found.");
            }
        } else {
            console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
        }
    });

}).on('error', (err) => {
    console.error(`Error: ${err.message}`);
});

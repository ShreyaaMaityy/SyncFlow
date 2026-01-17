require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    console.error("No API KEY in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-pro", "gemini-1.5-pro-001", "gemini-pro", "gemini-1.0-pro"];

async function test() {
    console.log("Starting Model Check...");
    for (const m of models) {
        try {
            process.stdout.write(`Testing ${m}... `);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hi");
            await result.response;
            console.log(`✅ SUCCESS`);
            console.log(`\nRECOMMENDATION: Use '${m}'`);
            process.exit(0);
        } catch (e) {
            console.log(`❌ FAILED`);
            // console.log(e.message);
        }
    }
    console.log("All models failed.");
}

test();

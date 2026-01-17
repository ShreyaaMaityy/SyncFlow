const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
// Ensure GEMINI_API_KEY is in .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function getAIResponse(userPrompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in server environment.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const systemPrompt = `
  You are an AI System Architect for a diagramming tool.
  Your goal is to interpret the user's request and either generate a system architecture or provide a helpful chat response.

  You must return a JSON object with the following structure:
  {
    "type": "chat" | "design",
    "content": ...
  }

  SCENARIO 1: CHAT
  If the user says "hi", "hello", asks a general question, or the input is NOT a request to design/draw a system:
  - Set "type": "chat"
  - Set "content": A string containing your friendly, helpful text response.

  SCENARIO 2: DESIGN
  If the user asks to "generate", "design", "draw", "create", or "show" a system/architecture:
  - Set "type": "design"
  - Set "content": A JSON object with "nodes" and "edges" as defined below:

  Nodes schema:
  - id: string (unique)
  - type: string ('clientNode', 'serverNode', 'databaseNode')
  - position: { x: number, y: number }
  - data: { label: string }

  Edges schema:
  - id: string
  - source: string (node id)
  - target: string (node id)
  - animated: boolean

  Example Design Output:
  {
    "type": "design",
    "content": {
      "nodes": [{ "id": "1", "type": "clientNode", ... }],
      "edges": [...]
    }
  }

  Only return the raw JSON object. Do not include markdown naming like \`\`\`json.
  `;

  try {
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    let text = response.text();

    // Clean up potential markdown code blocks
    text = text.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();

    return JSON.parse(text);
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
      console.error("Gemini AI API Quota Exceeded:", error.message);
      throw new Error("Quota exceeded");
    }
    console.error("Gemini AI API Error:", error);
    throw new Error("Failed to generate architecture.");
  }
}

module.exports = { getAIResponse };

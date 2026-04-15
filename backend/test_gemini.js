require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
      config: {
        systemInstruction: "You are a test bot",
        responseMimeType: "application/json"
      }
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("SDK Error details:", err);
  }
}
test();

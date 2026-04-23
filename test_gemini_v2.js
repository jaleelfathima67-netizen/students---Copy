import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function testGemini(modelName) {
    console.log(`Testing model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        console.log(`✅ Success with ${modelName}:`, result.response.text());
        return true;
    } catch (error) {
        console.error(`❌ Error with ${modelName}:`, error.message);
        return false;
    }
}

(async () => {
    await testGemini("gemini-2.5-flash");
    await testGemini("gemini-2.0-flash");
    await testGemini("gemini-2.5-pro");
})();

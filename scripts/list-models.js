
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log("Listing models...");
        // This is a guess, let's see if it works
        // The SDK actually doesn't have a direct listModels yet in all versions 
        // but we can try common ones
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("hi");
        console.log("Gemini 1.5 Flash works:", result.response.text());
    } catch (error) {
        console.error("Gemini 1.5 Flash failed:", error.message);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const result = await model.generateContent("hi");
            console.log("Gemini 1.0 Pro works:", result.response.text());
        } catch (error2) {
            console.error("Gemini 1.0 Pro failed:", error2.message);
        }
    }
}

listModels();

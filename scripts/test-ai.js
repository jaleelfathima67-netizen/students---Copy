import dotenv from "dotenv";
import { generatePlanFromAI } from "../src/backend/models/service.js";

dotenv.config();

async function testAI() {
    const provider = process.env.AI_PROVIDER || "ollama";
    const model = process.env.OLLAMA_MODEL || "phi3:mini";

    console.log(`--- Testing AI ---`);
    console.log(`Provider: ${provider}`);
    if (provider === "ollama") console.log(`Model: ${model}`);
    console.log(`------------------`);

    try {
        const prompt = "Say 'AI connection successful' in 3 words.";
        console.log("Sending prompt...");
        const response = await generatePlanFromAI(prompt);
        console.log("Response:", response);
        console.log("\n✅ Test Passed!");
    } catch (error) {
        console.error("\n❌ Test Failed!");
        console.error("Error:", error.message);
    }
}

testAI();

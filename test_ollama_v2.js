import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const CONFIG = {
    OLLAMA_URL: "http://127.0.0.1:11434/api/generate",
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || "phi3:latest",
};

async function testOllama() {
    console.log(`Testing Ollama model: ${CONFIG.OLLAMA_MODEL}`);
    const payload = {
        model: CONFIG.OLLAMA_MODEL,
        prompt: "Say hello",
        stream: false,
    };

    try {
        const { data } = await axios.post(CONFIG.OLLAMA_URL, payload, { timeout: 30000 });
        console.log(`✅ Success with ${CONFIG.OLLAMA_MODEL}:`, data.response);
    } catch (error) {
        if (error.code === "ECONNREFUSED") {
            console.error("❌ Ollama is not running at 11434");
        } else {
            console.error("❌ Ollama Error:", error.message);
        }
    }
}

testOllama();

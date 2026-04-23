
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log("Listing models via REST API...");
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        console.log("Models available:");
        response.data.models.forEach(m => console.log(`- ${m.name}`));
    } catch (error) {
        console.error("Error listing models:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

listModels();

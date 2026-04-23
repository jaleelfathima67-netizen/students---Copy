
import axios from 'axios';

async function testGemini() {
    console.log("Testing /api/generate-gemini endpoint...");
    try {
        const response = await axios.post('http://localhost:5000/api/generate-gemini', {
            prompt: "Hi, say hello!",
            stream: false
        }, { timeout: 10000 });
        console.log("Response successful:", response.data);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error("Error: Backend server is not running on port 5000.");
        } else {
            console.error("Error calling API:", error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
            }
        }
    }
}

testGemini();

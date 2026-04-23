import axios from "axios";

async function diagnose() {
    console.log("🔍 [Diagnostic] Testing AI endpoints...");

    const testTopic = "Mathematics";

    // Test 1: Plan Generation (Streaming)
    console.log("\n1️⃣ Testing /generate-plan...");
    try {
        const res = await axios.post("http://localhost:5000/generate-plan",
            { prompt: testTopic },
            { timeout: 10000 }
        );
        console.log("✅ Plan route is reachable.");
    } catch (err) {
        console.error("❌ Plan route failed:", err.message);
        if (err.response) console.log("   Details:", err.response.data);
    }

    // Test 2: Gemini Direct
    console.log("\n2️⃣ Testing /api/generate-gemini...");
    try {
        const res = await axios.post("http://localhost:5000/api/generate-gemini",
            { prompt: "Hi" },
            { timeout: 10000 }
        );
        console.log("✅ Gemini route is reachable.");
        console.log("   AI Response:", res.data.response?.substring(0, 50) + "...");
    } catch (err) {
        console.error("❌ Gemini route failed:", err.message);
        if (err.response) console.log("   Details:", err.response.data);
    }

    // Test 3: Ollama Directly (Local)
    console.log("\n3️⃣ Testing Ollama directly (11434)...");
    try {
        await axios.get("http://127.0.0.1:11434");
        console.log("✅ Ollama service is running.");

        console.log("   Checking model 'phi:latest'...");
        const res = await axios.post("http://127.0.0.1:11434/api/tags");
        const models = res.data.models.map(m => m.name);
        if (models.includes("phi:latest")) {
            console.log("✅ Model 'phi:latest' is available.");
        } else {
            console.warn("⚠️ Model 'phi:latest' is NOT in the list.");
            console.log("   Available models:", models.join(", "));
        }
    } catch (err) {
        console.error("❌ Ollama service not found:", err.message);
    }
}

diagnose();

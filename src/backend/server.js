import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { exec } from "child_process";
import axios from "axios";

dotenv.config();

import { generateDailyPlan } from "./models/dailyPlanController.js";
import { generateNotes, generateQuiz, generateTest, generateAllContent } from "./models/unifiedAiController.js";
import { generatePlanFromAI } from "./models/service.js";
import { signup, login, updateProgress, getLeaderboard } from "./models/userController.js";

const app = express();

app.use(cors());
app.use(express.json());





mongoose
  .connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/studyplanner", {
    serverSelectionTimeoutMS: 5000, 
  })
  .then(() => console.log("✅ MongoDB: Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error!");
    console.error("   Message:", err.message);
    console.error("   TIP: Make sure your MongoDB service is running (e.g. `mongod`) or check your connection string.");
  });


mongoose.set('bufferCommands', false);





app.get("/test", (req, res) => {
  res.json({ message: "Backend working" });
});





function setStreamHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

function pipeStream(aiStream, res) {
  if (!aiStream || !aiStream.data) {
    return res.end(JSON.stringify({ error: "No stream data received" }));
  }

  
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(":\n"); 
    }
  }, 10000);

  aiStream.data.on("data", (chunk) => {
    res.write(chunk);
  });

  aiStream.data.on("error", (err) => {
    clearInterval(heartbeat);
    console.error("Streaming error:", err.message);
    if (!res.headersSent) res.status(500).write(JSON.stringify({ error: err.message }));
    res.end();
  });

  aiStream.data.on("end", () => {
    clearInterval(heartbeat);
    res.end();
  });
}





app.post("/generate-plan", async (req, res) => {
  try {
    const { prompt, provider } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    setStreamHeaders(res);
    const stream = await generateDailyPlan(prompt, true, "gemini");
    pipeStream(stream, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(JSON.stringify({ error: error.message }) + "\n");
      res.end();
    }
  }
});

app.post("/generate-notes", async (req, res) => {
  try {
    const { topic, tasks, stream, provider } = req.body;

    if (stream) {
      setStreamHeaders(res);
      pipeStream(await generateNotes(topic, tasks, true, "gemini"), res);
      return;
    }

    const notes = await generateNotes(topic, tasks, false, "gemini");
    res.json({ notes });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(JSON.stringify({ error: error.message }) + "\n");
      res.end();
    }
  }
});

app.post("/generate-quiz", async (req, res) => {
  try {
    const { topic, tasks, stream, provider } = req.body;

    if (stream) {
      setStreamHeaders(res);
      pipeStream(await generateQuiz(topic, tasks || [], true, "gemini"), res);
      return;
    }

    const questions = await generateQuiz(topic, tasks || [], false, "gemini");
    res.json(questions);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(JSON.stringify({ error: error.message }) + "\n");
      res.end();
    }
  }
});

app.post("/generate-test", async (req, res) => {
  try {
    const { topic, tasks, stream, provider } = req.body;

    if (stream) {
      setStreamHeaders(res);
      pipeStream(await generateTest(topic, tasks || [], true, "gemini"), res);
      return;
    }

    const questions = await generateTest(topic, tasks || [], false, "gemini");
    res.json(questions);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(JSON.stringify({ error: error.message }) + "\n");
      res.end();
    }
  }
});

app.post("/generate-all", async (req, res) => {
  try {
    const { topic, tasks } = req.body;
    const content = await generateAllContent(topic, tasks);
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.post("/api/generate-gemini", async (req, res) => {
  try {
    const { prompt, stream, provider } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "Prompt is required" });
    }
    if (stream) {
      setStreamHeaders(res);
      
      return pipeStream(await generatePlanFromAI(prompt, true, "gemini"), res);
    }
    const aiResponse = await generatePlanFromAI(prompt, false, "gemini");
    const responseText = typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse);
    res.json({ response: responseText });
  } catch (error) {
    console.error("AI Route Error:", error.message);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
});





app.post("/api/auth/signup", signup);
app.post("/api/auth/login", login);
app.post("/api/user/update-progress", updateProgress);
app.get("/api/user/leaderboard", getLeaderboard);





async function ensureOllamaRunning() {
  
  console.log("ℹ️ AI Provider: Gemini (Ollama disabled)");
}

app.listen(5000, async () => {
  console.log("🚀 Server: Running on port 5000");
  await ensureOllamaRunning();
});
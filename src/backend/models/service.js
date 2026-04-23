
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PassThrough } from "stream";

dotenv.config();

const CONFIG = {
  OLLAMA_URL: "http://127.0.0.1:11434/api/generate",
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || "phi:latest",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  GEMINI_FALLBACK: "gemini-2.5-flash",
  TIMEOUT: 90000,
};

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;


export const generatePlanFromAI = async (userPrompt, stream = false, provider = null) => {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  
  const selectedProvider = "gemini";

  
  if (hasGemini) {
    try {
      return await generateWithGemini(userPrompt, stream);
    } catch (err) {
      console.error(`❌ [Gemini Error] ${err.message}`);
      
      throw new Error(`Gemini AI error: ${err.message}`);
    }
  }

  

  throw new Error("Gemini AI is not configured. Please set your GEMINI_API_KEY in the .env file.");
};


async function generateWithGemini(prompt, stream) {
  if (!genAI) throw new Error("GEMINI_API_KEY missing from .env");

  const fallbackModels = ["gemini-2.5-flash"];

  const runWithRetry = async (currentModelName, isStream, retryCount = 0) => {
    const currentModel = genAI.getGenerativeModel({ model: currentModelName });
    try {
      if (isStream) {
        const initialConnectionTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gemini initial connection timed out after 20s")), 20000)
        );

        const result = await Promise.race([
          currentModel.generateContentStream(prompt),
          initialConnectionTimeout
        ]);

        const dataStream = new PassThrough();

        (async () => {
          try {
            for await (const chunk of result.stream) {
              if (dataStream.destroyed) break;
              const text = chunk.text();
              
              if (text) dataStream.write(JSON.stringify({ response: text }) + "\n");
            }
          } catch (err) {
            console.error("Gemini stream async error:", err.message);
            if (!dataStream.destroyed) {
              dataStream.write(JSON.stringify({ error: `Stream error: ${err.message}` }) + "\n");
            }
          } finally {
            if (!dataStream.destroyed) dataStream.end();
          }
        })();

        return { data: dataStream };
      }

      
      const { response } = await currentModel.generateContent(prompt);
      return parseAiResponse(response.text());
    } catch (err) {
      
      if (err.message.includes("429") || err.message.includes("Quota")) {
        console.warn(`⏳ [Gemini 429] Rate limit/Quota hit on ${currentModelName}.`);

        
        if (currentModelName !== CONFIG.GEMINI_FALLBACK) {
          console.warn(`🔄 Switching to fallback model: ${CONFIG.GEMINI_FALLBACK}`);
          return await runWithRetry(CONFIG.GEMINI_FALLBACK, isStream, 0);
        }

        
        if (retryCount < 2) {
          const wait = (retryCount + 1) * 2000;
          console.warn(`⏳ [Gemini 429 Fallback] Retrying in ${wait / 1000}s (attempt ${retryCount + 1}/2)...`);
          await new Promise(r => setTimeout(r, wait));
          return await runWithRetry(currentModelName, isStream, retryCount + 1);
        }

        throw new Error("AI Quote Exceeded (429) on all available models. Please wait a few minutes before trying again.");
      }

      
      if ((err.message.includes("503") || err.message.includes("overloaded")) && retryCount < 2) {
        const wait = (retryCount + 1) * 3000;
        console.warn(`⏳ [Gemini 503] Overloaded. Retrying in ${wait / 1000}s (attempt ${retryCount + 1}/2)...`);
        await new Promise(r => setTimeout(r, wait));
        return await runWithRetry(currentModelName, isStream, retryCount + 1);
      }

      throw err;
    }
  };

  try {
    return await runWithRetry(CONFIG.GEMINI_MODEL, stream);
  } catch (err) {
    if (err.message.includes("404")) {
      throw new Error(`Model ${CONFIG.GEMINI_MODEL} not found. Please check your Gemini API configuration.`);
    }
    throw err;
  }
}




function parseAiResponse(aiText) {
  if (!aiText) return "";
  const text = aiText.trim();

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch) {
      const candidate = jsonMatch[0].trim();
      if (candidate.startsWith('[') && candidate.endsWith(']')) return JSON.parse(candidate);
      if (candidate.startsWith('{') && candidate.endsWith('}')) return JSON.parse(candidate);
    }
  } catch (e) {
    console.warn("Regex JSON match failed:", e.message);
  }

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return text;
    }
  }
}

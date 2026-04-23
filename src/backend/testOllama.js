import { ollama } from "ollama";
import dotenv from "dotenv";

dotenv.config(); 

const model = "llama3";

const generatePlanAI = async (prompt) => {
  try {
    const response = await ollama.call(model, { prompt });
    return response.output;
  } catch (error) {
    console.error("Error calling Ollama:", error);
  }
};

(async () => {
  const prompt = "Create a 1-hour math study plan for a student";
  const result = await generatePlanAI(prompt);
  console.log("AI Plan output:", result);
})();

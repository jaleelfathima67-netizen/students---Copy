
import { generatePlanFromAI } from "./service.js";

export const generateDailyPlan = async (topic, stream = false, provider = null) => {
  const prompt = `Generate a study timetable for the topic: "${topic}".
Return ONLY a valid JSON array of exactly 5 objects. No markdown, no titles, no intro text, no explanation.
Each object must have a "topic" (subtopic name, be specific and relevant) and "time" (number of minutes, between 30-60).
Example format: [{"topic":"Introduction and Core Concepts","time":45},{"topic":"Key Algorithms","time":60}]
JSON:`;
  return await generatePlanFromAI(prompt, stream, provider);
};
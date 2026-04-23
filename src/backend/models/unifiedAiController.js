
import { generatePlanFromAI } from "./service.js";


export const generateNotes = async (topic, tasks = [], stream = false, provider = null) => {
    let prompt;
    if (tasks && tasks.length > 0) {
        const subtopicList = tasks.map((t, i) => `${i + 1}. ${t.topic || t.task}`).join("\n");
        prompt = `Write concise study notes for the topic "${topic}".
Cover EACH of these subtopics from the study timetable:
${subtopicList}

For each subtopic write 3-4 bullet points. Use plain text only, no markdown symbols like **, ##, or *.`;
    } else {
        
        prompt = `Write comprehensive study notes for the topic "${topic}".
Include an overview, key principles, major concepts, and practical applications. 
Provide at least 10 detailed bullet points. Use plain text only, no markdown.`;
    }
    return await generatePlanFromAI(prompt, stream, (provider || "gemini"));
};

export const generateQuiz = async (topic, tasks = [], stream = false, provider = null) => {
    let contextLine = "";
    if (tasks && tasks.length > 0) {
        const subtopics = tasks.map(t => t.topic || t.task).join(", ");
        contextLine = `\nFocus on these subtopics: ${subtopics}`;
    }
    const prompt = `Generate 5 multiple choice questions (MCQs) for the topic: "${topic}".${contextLine}
Ensure the questions cover the most important aspects of the subject.
Return ONLY a valid JSON array. No markdown, no intro, no explanation.
Format: [{"question":"...","options":["A","B","C","D"],"answer":"Correct Option"}]
JSON:`;
    return await generatePlanFromAI(prompt, stream, (provider || "gemini"));
};

export const generateTest = async (topic, tasks = [], stream = false, provider = null) => {
    let contextLine = "";
    if (tasks && tasks.length > 0) {
        const subtopics = tasks.map(t => t.topic || t.task).join(", ");
        contextLine = `\nFocus on these subtopics: ${subtopics}`;
    }
    const prompt = `Generate 4 detailed short answer questions for a mock test on the topic: "${topic}".${contextLine}
The questions should test deep understanding and application of concepts.
Return ONLY a valid JSON array. No markdown, no intro, no explanation.
Format: [{"question":"..."}]
JSON:`;
    return await generatePlanFromAI(prompt, stream, (provider || "gemini"));
};

export const generateAllContent = async (topic, tasks = []) => {
    const subtopicList = tasks && tasks.length > 0 ? tasks.map(t => t.topic || t.task).join(", ") : topic;
    const prompt = `Create a learning bundle for "${topic}" based on these subtopics: ${subtopicList}.
Quiz: 5 MCQs. Test: 4 short answer questions.
Return ONLY this JSON structure: {"notes":"","quiz":[],"test":[]}
JSON:`;
    return await generatePlanFromAI(prompt);
};

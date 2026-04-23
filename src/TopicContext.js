import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const TopicContext = createContext(null);

export const TopicProvider = ({ children }) => {
    const [currentTopic, setCurrentTopicState] = useState(
        () => localStorage.getItem("currentStudyTopic") || ""
    );
    const [aiMode, setAiModeState] = useState("online");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [syncStatus, setSyncStatus] = useState({ notes: "pending", quiz: "pending", test: "pending" });

    const setCurrentTopic = (topic) => {
        const trimmed = (topic || "").trim();
        if (trimmed) {
            localStorage.setItem("currentStudyTopic", trimmed);
            setCurrentTopicState(trimmed);
        }
    };

    const setAiMode = (mode) => {
        
        console.log("AI Mode change requested, but Gemini is forced as the sole provider.");
    };

    const triggerSequentialGeneration = useCallback(async (topic, providerOverride = null) => {
        if (!topic) return;
        const trimmedTopic = topic.trim();
        setLoading(true);
        setError("");

        const provider = providerOverride || aiMode || "online";
        console.log(`🚀 Global Parallel Generation for: ${trimmedTopic} | Mode: ${provider}`);

        localStorage.removeItem(`plan_${trimmedTopic}`);
        localStorage.removeItem(`notes_${trimmedTopic}`);
        localStorage.removeItem(`quiz_${trimmedTopic}`);
        localStorage.removeItem(`test_${trimmedTopic}`);
        setSyncStatus({ notes: "pending", quiz: "pending", test: "pending" });

        const fetchContent = async (type, endpoint, body) => {
            if (type !== "plan") setSyncStatus(prev => ({ ...prev, [type]: "loading" }));

            try {
                const controller = new AbortController();
                
                const timeoutId = setTimeout(() => controller.abort(), 90000);

                const res = await fetch(`/${endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!res.ok) {
                    let errMsg = `${type} generation failed`;
                    try {
                        const errorData = await res.json();
                        if (errorData && errorData.error) errMsg = errorData.error;
                    } catch (parseErr) {  }
                    throw new Error(errMsg);
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let fullText = "";
                let accumulated = "";
                let finalData = type === "notes" ? "" : [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    accumulated += decoder.decode(value, { stream: true });
                    const lines = accumulated.split("\n");
                    accumulated = lines.pop();

                    for (const line of lines) {
                        if (!line.trim() || line.trim() === ":") continue;
                        try {
                            const p = JSON.parse(line);
                            if (p.error) throw new Error(p.error);
                            if (p.response) {
                                fullText += p.response;
                                if (type === "notes") {
                                    finalData = fullText;
                                    localStorage.setItem(`notes_${trimmedTopic}`, finalData);
                                    window.dispatchEvent(new CustomEvent('contentUpdated', { detail: { type: 'notes', topic: trimmedTopic } }));
                                } else {
                                    
                                    
                                    const objects = fullText.match(/\{[^{}]*?\}/g);
                                    if (objects) {
                                        try {
                                            const currentParsed = objects.map(objStr => {
                                                try { return JSON.parse(objStr); } catch { return null; }
                                            }).filter(item => {
                                                if (!item) return false;
                                                if (type === "plan") return item.topic || item.task;
                                                if (type === "quiz") return item.question && item.options;
                                                if (type === "test") return item.question;
                                                return true;
                                            });

                                            if (currentParsed.length > (finalData?.length || 0)) {
                                                finalData = currentParsed;
                                                localStorage.setItem(`${type}_${trimmedTopic}`, JSON.stringify(finalData));
                                                
                                                window.dispatchEvent(new CustomEvent('contentUpdated', { detail: { type, topic: trimmedTopic } }));
                                                if (type === "plan") window.dispatchEvent(new Event('topicUpdated'));
                                            }
                                        } catch {  }
                                    }
                                }
                            }
                        } catch {  }
                    }
                }
                clearTimeout(timeoutId);

                
                if (finalData && (type === "notes" ? finalData.length > 20 : finalData.length > 0)) {
                    localStorage.setItem(`${type}_${trimmedTopic}`, typeof finalData === "string" ? finalData : JSON.stringify(finalData));
                    window.dispatchEvent(new CustomEvent('contentUpdated', { detail: { type, topic: trimmedTopic } }));
                    if (type !== "plan") setSyncStatus(prev => ({ ...prev, [type]: "ready" }));
                } else if (type !== "plan") {
                    setSyncStatus(prev => ({ ...prev, [type]: "pending" }));
                }

                if (type === "plan") {
                    setLoading(false);
                    return finalData; 
                }
            } catch (err) {
                console.warn(`[${type}] failed:`, err.message);
                if (type === "plan") {
                    setError(err.message || "Failed to generate plan.");
                    setLoading(false);
                    return null;
                } else {
                    setSyncStatus(prev => ({ ...prev, [type]: "pending" }));
                }
            }
        };

        const start = async () => {
            
            const generatedTasks = await fetchContent("plan", "generate-plan", { prompt: trimmedTopic, provider });

            
            await new Promise(r => setTimeout(r, 500));

            
            if (generatedTasks && generatedTasks.length > 0) {
                
                fetchContent("notes", "generate-notes", { topic: trimmedTopic, tasks: generatedTasks, stream: true, provider });
                await new Promise(r => setTimeout(r, 300));
                fetchContent("quiz", "generate-quiz", { topic: trimmedTopic, tasks: generatedTasks, stream: true, provider });
                await new Promise(r => setTimeout(r, 300));
                fetchContent("test", "generate-test", { topic: trimmedTopic, tasks: generatedTasks, stream: true, provider });
            } else {
                console.warn("Skipping notes/quiz/test generation because plan tasks were not retrieved.");
            }
        };
        start();

    }, [aiMode]);


    const checkCache = useCallback((topic) => {
        const status = { notes: "pending", quiz: "pending", test: "pending" };
        if (localStorage.getItem(`notes_${topic}`)) status.notes = "ready";
        if (localStorage.getItem(`quiz_${topic}`)) status.quiz = "ready";
        if (localStorage.getItem(`test_${topic}`)) status.test = "ready";
        setSyncStatus(status);
    }, []);

    
    useEffect(() => {
        const onStorage = () => {
            const stored = localStorage.getItem("currentStudyTopic");
            if (stored && stored !== currentTopic) {
                setCurrentTopicState(stored);
                checkCache(stored);
            }
            const storedAiMode = localStorage.getItem("aiMode");
            if (storedAiMode && storedAiMode !== aiMode) {
                setAiModeState(storedAiMode);
            }
        };
        window.addEventListener("storage", onStorage);
        window.addEventListener("topicUpdated", onStorage);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("topicUpdated", onStorage);
        };
    }, [currentTopic, aiMode, checkCache]);

    return (
        <TopicContext.Provider value={{
            currentTopic,
            setCurrentTopic,
            aiMode,
            setAiMode,
            loading,
            error,
            syncStatus,
            triggerSequentialGeneration,
            checkCache
        }}>
            {children}
        </TopicContext.Provider>
    );
};

export const useTopic = () => useContext(TopicContext);

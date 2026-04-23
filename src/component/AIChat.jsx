import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaArrowLeft, FaPaperPlane, FaRobot, FaGlobe } from "react-icons/fa";
import { useTopic } from "../TopicContext";
import "./AIChat.css";

const AIChat = ({ user }) => {
    const { setCurrentTopic, triggerSequentialGeneration } = useTopic();
    const location = useLocation();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "ai", text: "Hello! I am your Online Assistant powered by Gemini. How can I help you today?" }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const initializedRef = useRef(false); 

    const handleSendMessage = useCallback(async (textOverride) => {
        const text = (textOverride || input).trim();
        if (!text) return;

        setMessages(prev => [...prev, { role: "user", text }]);
        setInput("");
        setLoading(true);
        
        setMessages(prev => [...prev, { role: "ai", text: "" }]);

        const attemptFetch = async (retries = 2) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const res = await fetch("/api/generate-gemini", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: text, stream: true }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    const statusMsg = errData.message || `HTTP ${res.status}`;
                    
                    if ((res.status === 429 || res.status === 503) && retries > 0) {
                        console.warn(`[AIChat] Rate limited (${res.status}), retrying in 3s... (${retries} left)`);
                        await new Promise(r => setTimeout(r, 3000));
                        return attemptFetch(retries - 1);
                    }
                    throw new Error(statusMsg);
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedLines = "";
                let accumulatedText = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    accumulatedLines += decoder.decode(value, { stream: true });
                    const lines = accumulatedLines.split("\n");
                    accumulatedLines = lines.pop();

                    for (const line of lines) {
                        if (!line.trim() || line.trim() === ":") continue;
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.error) {
                                
                                accumulatedText = `Sorry, I hit an issue: ${parsed.error}`;
                            } else if (parsed.response) {
                                accumulatedText += parsed.response;
                            }

                            setMessages(prev => {
                                const newMsgs = [...prev];
                                if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === "ai") {
                                    newMsgs[newMsgs.length - 1] = { role: "ai", text: accumulatedText };
                                }
                                return newMsgs;
                            });
                        } catch {  }
                    }
                }

                
                if (!accumulatedText) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        if (newMsgs[newMsgs.length - 1]?.role === "ai") {
                            newMsgs[newMsgs.length - 1] = { role: "ai", text: "I received an empty response. Please try again." };
                        }
                        return newMsgs;
                    });
                }
            } catch (err) {
                console.error("AIChat fetch error:", err);
                let errorText;
                if (err.name === "AbortError") {
                    errorText = "Request timed out (60s). The AI might be busy. Please try again.";
                } else if (err.message.includes("429") || err.message.includes("Quota")) {
                    errorText = "The AI is currently receiving too many requests. Please wait a moment and try again.";
                } else if (err.message.includes("Failed to fetch") || err.message.includes("ECONNREFUSED")) {
                    errorText = "Cannot connect to the server. Please make sure your internet connection is active.";
                } else {
                    errorText = `Something went wrong: ${err.message}. Please try again.`;
                }
                setMessages(prev => {
                    const newMsgs = [...prev];
                    if (newMsgs[newMsgs.length - 1]?.role === "ai") {
                        newMsgs[newMsgs.length - 1] = { role: "ai", text: errorText };
                    }
                    return newMsgs;
                });
            }
        };

        await attemptFetch();
        setLoading(false);
    }, [input]);

    const lastTopicRef = useRef("");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const topic = params.get("topic");
        if (topic && topic !== lastTopicRef.current) {
            lastTopicRef.current = topic;
            setMessages([
                { role: "ai", text: `Hello! I see you are starting a study session for "${topic}". Ask me anything about it!` }
            ]);
            setCurrentTopic(topic);
            handleSendMessage(`Give me a brief overview of "${topic}" and its main concepts.`);
            
            
            triggerSequentialGeneration(topic);
        }
    }, [location.search, setCurrentTopic, triggerSequentialGeneration, handleSendMessage]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="chat-container">
            <div className="chat-header">
                <Link to="/studyplan" className="back-link"><FaArrowLeft /> Study Plan</Link>
                <div className="header-info">
                    <FaGlobe className="online-icon" />
                    <span>Online Assistant (Gemini)</span>
                </div>
            </div>

            <div className="messages-wrapper">
                {messages.map((msg, i) => (
                    <div key={i} className={`message-bubble ${msg.role}`}>
                        <div className="avatar">
                            {msg.role === "ai" ? <FaRobot /> : "U"}
                        </div>
                        <div className="text-content">
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="message-bubble ai loading">
                        <div className="avatar"><FaRobot /></div>
                        <div className="dots">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="chat-input-wrapper">
                <input
                    type="text"
                    placeholder="Ask anything about your topic..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
                    disabled={loading}
                />
                <button onClick={() => handleSendMessage()} disabled={loading}>
                    <FaPaperPlane />
                </button>
            </div>
        </div>
    );
};

export default AIChat;

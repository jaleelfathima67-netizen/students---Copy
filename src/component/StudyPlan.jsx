import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaBookOpen, FaCheckCircle, FaClock } from "react-icons/fa";
import { useTopic } from "../TopicContext";
import "./StudyPlan.css";

const StudyPlan = ({ user, updateUser }) => {
    const {
        currentTopic,
        setCurrentTopic,
        aiMode,
        setAiMode,
        loading,
        error,
        syncStatus,
        triggerSequentialGeneration,
        checkCache
    } = useTopic();

    const [tasks, setTasks] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [completedTaskIds, setCompletedTaskIds] = useState([]);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (user && user.completedTasks) {
            setCompletedTaskIds(user.completedTasks.map(t => t.taskId));
        }
    }, [user]);

    
    useEffect(() => {
        const loadPlan = () => {
            if (currentTopic) {
                const cached = localStorage.getItem(`plan_${currentTopic}`);
                if (cached) setTasks(JSON.parse(cached));
                else setTasks([]); 
            }
        };
        loadPlan();
        window.addEventListener("topicUpdated", loadPlan);
        return () => window.removeEventListener("topicUpdated", loadPlan);
    }, [currentTopic]);

    useEffect(() => {
        const trimmed = prompt.trim();
        if (!trimmed || trimmed.length < 3) return;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { checkCache(trimmed); }, 1000);
        return () => clearTimeout(debounceRef.current);
    }, [prompt, checkCache]);

    const navigate = useNavigate();

    const generatePlan = useCallback(() => {
        const trimmed = prompt.trim();
        if (!trimmed) return alert("Please enter a topic!");

        if (!user) {
            alert("Please login or register to generate your personalized study plan!");
            navigate("/login");
            return;
        }

        setCurrentTopic(trimmed);
        triggerSequentialGeneration(trimmed);
    }, [prompt, user, navigate, setCurrentTopic, triggerSequentialGeneration]);

    const handleCompleteTask = async (taskIndex, taskItem) => {
        if (!user) return alert("Please login to track your progress!");
        const taskId = `${prompt}_${taskIndex}`;
        if (completedTaskIds.includes(taskId)) return;

        try {
            const response = await fetch("/api/user/update-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user._id,
                    taskId,
                    taskName: taskItem.topic || taskItem.task,
                    marks: 10
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCompletedTaskIds(prev => [...prev, taskId]);
                if (data.user) {
                    updateUser(data.user);
                }
                alert("Task completed! +10 marks added.");
            }
        } catch (err) { console.error("Progress update error:", err); }
    };

    const syncBadgeColors = {
        pending: { bg: "#f1f5f9", color: "#64748b" },
        loading: { bg: "#fef9c3", color: "#854d0e" },
        ready: { bg: "#dcfce7", color: "#166534" }
    };

    return (
        <div className="study-plan-container">
            {}
            <div className="top-nav">
                <Link to="/" className="back-btn"><FaArrowLeft /> Home</Link>
            </div>

            {}
            <div className="study-plan-header">
                <h2>AI Study Plan Tracer 🚀</h2>
                <p>Prepare your full study schedule in seconds.</p>
            </div>

            {}
            <div className="search-box-wrapper">
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search for any topic (e.g. Photosynthesis, Calculus)..."
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyPress={e => e.key === "Enter" && generatePlan()}
                    />
                    <button className="generate-btn" onClick={generatePlan} disabled={loading}>
                        {loading ? "Syncing..." : "Generate Study Guide"}
                    </button>
                </div>

                {}
                {currentTopic && (
                    <div className="sync-badges">
                        {["notes", "quiz", "test"].map(type => {
                            const st = syncStatus[type];
                            const s = syncBadgeColors[st] || syncBadgeColors.pending;
                            return (
                                <div key={type} className={`badge ${st}`} style={{ background: s.bg, color: s.color }}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}&nbsp;
                                    {st === "ready" ? "✅" : st === "loading" ? "⏳" : "⌛"}
                                    {st === "ready" && (
                                        <Link to={`/${type}`} className="badge-view-link">Open</Link>
                                    )}
                                </div>
                            );
                        })}
                        <Link to={`/aichat?topic=${currentTopic || prompt}`} className="badge online-badge">
                            Research Online <FaSearch style={{ marginLeft: "5px", fontSize: "0.8rem" }} />
                        </Link>
                    </div>
                )}
            </div>

            {}
            {error && <div className="error-message-container"><div className="error-message">{error}</div></div>}

            {}
            {currentTopic && (
                <div className="plan-cards-section">
                    <div className="plan-cards-header">
                        <FaBookOpen /> Study Timetable for <strong>{currentTopic}</strong>
                    </div>

                    <div className="plan-cards-list">
                        {loading && tasks.length === 0
                            ? [...Array(4)].map((_, i) => (
                                <div key={i} className="plan-card skeleton-card">
                                    <div className="skeleton-step"></div>
                                    <div className="skeleton-body">
                                        <div className="skeleton-line wide"></div>
                                        <div className="skeleton-line short"></div>
                                    </div>
                                    <div className="skeleton-actions"></div>
                                </div>
                            ))
                            : tasks.map((task, i) => {
                                const taskId = `${prompt}_${i}`;
                                const isCompleted = completedTaskIds.includes(taskId);
                                const duration = parseInt(task.time) || 45;

                                return (
                                    <div key={i} className={`plan-card ${isCompleted ? "completed" : ""}`}>
                                        {}
                                        <div className="plan-card-step">
                                            {isCompleted
                                                ? <FaCheckCircle className="step-check" />
                                                : <span className="step-num">{i + 1}</span>
                                            }
                                        </div>

                                        {}
                                        <div className="plan-card-body">
                                            <span className="plan-card-topic">{task.topic || task.task}</span>
                                            <span className="plan-card-duration">
                                                <FaClock style={{ marginRight: "5px" }} />{duration} mins
                                            </span>
                                        </div>

                                        {}
                                        <div className="plan-card-actions">
                                            <Link
                                                to="/notes"
                                                className="study-btn"
                                                onClick={() => setCurrentTopic(currentTopic)}
                                            >
                                                Study Now
                                            </Link>
                                            <button
                                                className={`complete-btn ${isCompleted ? "done" : ""}`}
                                                onClick={() => handleCompleteTask(i, task)}
                                                disabled={isCompleted}
                                            >
                                                {isCompleted ? "Done ✅" : "Mark Done"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            )}

            {}
            {!currentTopic && tasks.length === 0 && !error && (
                <div className="empty-state">
                    <div className="empty-icon"><FaSearch /></div>
                    <p>Type a topic above and press <strong>Generate Guide</strong> to create your personalised study plan.</p>
                </div>
            )}
        </div>
    );
};

export default StudyPlan;

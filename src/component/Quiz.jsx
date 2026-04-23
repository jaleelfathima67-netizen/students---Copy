import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaQuestionCircle, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTopic } from "../TopicContext";
import "./Quiz.css";
import emailjs from '@emailjs/browser';

const Quiz = ({ user, updateUser }) => {
  const { currentTopic, syncStatus } = useTopic();
  const [displayTopic, setDisplayTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (currentTopic) {
      setDisplayTopic(currentTopic);
      const cached = localStorage.getItem(`quiz_${currentTopic}`);
      if (cached) {
        try { setQuestions(JSON.parse(cached)); } catch { }
        setLoading(false);
      } else if (syncStatus.quiz === "loading") {
        setQuestions([]);
        setLoading(true);
      } else {
        setQuestions([]);
        setLoading(false);
      }
    }
  }, [currentTopic, syncStatus.quiz]);

  useEffect(() => {
    const onContentUpdate = (e) => {
      if (e.detail.topic === currentTopic && e.detail.type === "quiz") {
        const cached = localStorage.getItem(`quiz_${currentTopic}`);
        if (cached) {
          try { setQuestions(JSON.parse(cached)); } catch { }
        }
        setLoading(false);
      }
    };
    window.addEventListener('contentUpdated', onContentUpdate);
    return () => window.removeEventListener('contentUpdated', onContentUpdate);
  }, [currentTopic]);


  const handleSelect = (qIndex, option) => {
    setSelected((prev) => ({ ...prev, [qIndex]: option }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (selected[index] === q.answer) score++;
    });
    return score;
  };

  const submitScore = async () => {
    if (Object.keys(selected).length < questions.length) {
      if (!window.confirm("You have completely answered the quiz! Would you like to submit?")) {
        return;
      }
    }

    if (user && user.grade <= 10 && !user.parentEmail) {
      if (!window.confirm("You do not have a parent's email on record. Proceed without generating an email report?")) {
        return;
      }
    }

    const score = calculateScore();
    setSubmitted(true);

    if (user && user._id) {
      try {
        const res = await fetch("/api/user/update-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            taskName: displayTopic,
            marks: score,
            type: 'quiz',
            reportData: {
              questions: questions,
              answers: selected
            }
          }),
        });
        
        const data = await res.json();
        if (data.user) {
          updateUser(data.user);
        }
      } catch (err) {
        console.error("Failed to update quiz progress:", err);
      }

      
      if (user.parentEmail) {
        const templateParams = {
          parent_email: user.parentEmail,
          name: user.name || "Student",
          task_name: displayTopic,
          current_date: new Date().toLocaleDateString(),
          marks: score,
        };

        emailjs.send(
          'service_c3o3r17', 
          'template_h1qmrmj', 
          templateParams, 
          'q8gZftAU9UlWMa8RQ'
        )
        .then((response) => {
           console.log('Email successfully sent!', response.status, response.text);
        }, (err) => {
           console.error('Failed to send email:', err);
        });
      }
    }
  };

  return (
    <div className="study-plan-container">
      <div className="top-nav">
        <Link to="/" className="back-btn">
          <FaArrowLeft /> Back to Home
        </Link>
      </div>

      <div className="study-plan-header">
        <FaQuestionCircle className="header-icon" />
        <h2>🧠 Today's Quiz</h2>
        <p>
          {displayTopic
            ? `Self-assessment for: ${displayTopic}`
            : "Topic synchronizing..."}
        </p>
      </div>

      {/* Spinner only shows if we have NO questions yet */}
      {loading && questions.length === 0 && (
        <div className="loading-overlay">
          <div className="spinner-large" style={{ margin: "0 auto" }}></div>
          <p style={{ marginTop: "20px", color: "var(--primary-color)" }}>AI is thinking...</p>
        </div>
      )}

      {error && (
        <div className="error-message-container">
          <div className="error-message">{error}</div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="quiz-questions">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="plan-table-wrapper" style={{ padding: "25px", marginBottom: "20px" }}>
              <h4 style={{ marginBottom: "15px", color: "#2d3748" }}>{qIndex + 1}. {q.question}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                {q.options && q.options.map((opt, optIndex) => (
                  <label key={optIndex} className={`quiz-option-label ${selected[qIndex] === opt ? "selected" : ""} ${submitted ? "disabled" : ""}`}>
                    <input type="radio" checked={selected[qIndex] === opt} onChange={() => handleSelect(qIndex, opt)} disabled={submitted} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <span className="spinner-small"></span> Generating more questions...
            </div>
          )}

          {!submitted ? (
            <div style={{ marginTop: "30px", padding: "20px", background: "#f8fafc", borderRadius: "15px", border: "1px solid #e2e8f0" }}>
              <button onClick={submitScore} className="generate-btn" style={{ width: "100%", padding: "18px", fontSize: "1.1rem" }}>
                Finish Assessment
              </button>
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "40px",
              background: "linear-gradient(135deg, #f0fff4 0%, #d4f7e2 100%)",
              color: "#276749",
              borderRadius: "25px",
              marginTop: "40px",
              boxShadow: "0 10px 30px rgba(39, 103, 73, 0.1)",
              border: "1px solid #c6f6d5"
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "15px", textShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>🏆</div>
              <h3 style={{ marginBottom: "15px", fontSize: "1.8rem", fontWeight: "700" }}>Assessment Completed!</h3>

              <div style={{
                background: "white",
                padding: "20px",
                borderRadius: "15px",
                display: "inline-block",
                textAlign: "left",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                marginBottom: "20px",
                width: "100%",
                maxWidth: "400px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid #f0f4ff", paddingBottom: "10px" }}>
                  <span style={{ color: "#718096", fontWeight: "600" }}>Topic:</span>
                  <span style={{ fontWeight: "700", color: "#2d3748" }}>{displayTopic}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid #f0f4ff", paddingBottom: "10px" }}>
                  <span style={{ color: "#718096", fontWeight: "600" }}>Date:</span>
                  <span style={{ fontWeight: "700", color: "#2d3748" }}>{new Date().toLocaleDateString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#718096", fontWeight: "600" }}>Marks Earned:</span>
                  <span style={{ fontWeight: "800", color: "#48bb78", fontSize: "1.2rem" }}>+{calculateScore()} XP</span>
                </div>
              </div>

              <div className="score-display" style={{ background: "transparent", color: "#276749", boxShadow: "none", fontSize: "1.5rem", padding: "0" }}>
                Score: {calculateScore()} / {questions.length}
              </div>

              <p style={{ fontSize: "1.1rem", opacity: "0.9", marginTop: "15px" }}>
                {user && user.parentEmail && "A completion report has been emailed to your parent."}
              </p>
              
            </div>
          )}
        </div>
      )}

      {questions.length === 0 && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <p>Go to <strong>Study Plan</strong> to start a session.</p>
        </div>
      )}
    </div>
  );
};

export default Quiz;

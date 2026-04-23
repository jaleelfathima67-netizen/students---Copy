import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaEdit, FaArrowLeft, FaFileUpload, FaCloudUploadAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTopic } from "../TopicContext";
import "./Test.css";
import emailjs from '@emailjs/browser';


const Test = ({ user, updateUser }) => {
  const { currentTopic, syncStatus } = useTopic();
  const [displayTopic, setDisplayTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [uploads, setUploads] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitTest = async () => {
    if (Object.keys(answers).length === 0 && Object.keys(uploads).length === 0) {
      return alert("Please provide some answers before submitting.");
    }

    if (user && user.grade <= 10 && !user.parentEmail) {
      if (!window.confirm("You do not have a parent's email on record. Proceed without generating an email report?")) {
        return;
      }
    }

    setSubmitted(true);

    if (user && user._id) {
      try {
        const res = await fetch("/api/user/update-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            taskName: displayTopic,
            marks: 20, 
            type: 'test',
            reportData: {
              questions: questions,
              answers: answers
            }
          }),
        });
        const data = await res.json();
        if (data.user) {
          updateUser(data.user);
        }
      } catch (err) {
        console.error("Failed to update test progress:", err);
      }

      
      if (user.parentEmail) {
        const templateParams = {
          parent_email: user.parentEmail,
          name: user.name || "Student",
          task_name: displayTopic,
          current_date: new Date().toLocaleDateString(),
          marks: 20, 
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

  useEffect(() => {
    if (currentTopic) {
      setDisplayTopic(currentTopic);
      const cached = localStorage.getItem(`test_${currentTopic}`);
      if (cached) {
        try { setQuestions(JSON.parse(cached)); } catch { }
        setLoading(false);
      } else if (syncStatus.test === "loading") {
        setQuestions([]);
        setLoading(true);
      } else {
        setQuestions([]);
        setLoading(false);
      }
    }
  }, [currentTopic, syncStatus.test]);

  useEffect(() => {
    const onContentUpdate = (e) => {
      if (e.detail.topic === currentTopic && e.detail.type === "test") {
        const cached = localStorage.getItem(`test_${currentTopic}`);
        if (cached) {
          try { setQuestions(JSON.parse(cached)); } catch { }
        }
        setLoading(false);
      }
    };
    window.addEventListener('contentUpdated', onContentUpdate);
    return () => window.removeEventListener('contentUpdated', onContentUpdate);
  }, [currentTopic]);


  const handleTextChange = (qIndex, value) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  };

  const handleFileUpload = (qIndex, file) => {
    if (!file) return;
    setUploads((prev) => ({ ...prev, [qIndex]: file.name }));
    alert(`File "${file.name}" ready for upload with Question ${qIndex + 1}`);
  };

  return (
    <div className="study-plan-container">
      <div className="top-nav">
        <Link to="/" className="back-btn">
          <FaArrowLeft /> Back to Home
        </Link>
      </div>

      <div className="study-plan-header">
        <FaEdit className="header-icon" />
        <h2>📝 Subjective Mock Test</h2>
        <p>
          {displayTopic
            ? `Write your answers for: ${displayTopic}`
            : "No topic selected. Go to Study Plan first."}
        </p>
      </div>

      {loading && questions.length === 0 && (
        <div className="loading-overlay">
          <div className="spinner-large" style={{ margin: "0 auto" }}></div>
          <p style={{ marginTop: "20px", color: "var(--primary-color)", fontWeight: "600" }}>
            AI is drafting your exam paper questions...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="error-message-container">
          <div className="error-message">{error}</div>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="test-form">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="plan-table-wrapper"
              style={{ padding: "30px", marginBottom: "25px" }}
            >
              <h4 style={{ marginBottom: "15px", color: "#2d3748", fontSize: "1.1rem" }}>
                {qIndex + 1}. {q.question}
              </h4>

              <textarea
                placeholder="Write your answer here..."
                className="subjective-input"
                style={{
                  width: "100%",
                  minHeight: "150px",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "2px solid #edf2f7",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  marginBottom: "15px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                disabled={submitted}
                value={answers[qIndex] || ""}
                onChange={(e) => handleTextChange(qIndex, e.target.value)}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label className="upload-label" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  background: "#f0f4ff",
                  color: "#4a63f2",
                  borderRadius: "10px",
                  cursor: submitted ? "default" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>
                  <FaFileUpload /> {uploads[qIndex] ? "Change File" : "Upload Hand-written Answer"}
                  <input
                    type="file"
                    style={{ display: "none" }}
                    disabled={submitted}
                    onChange={(e) => handleFileUpload(qIndex, e.target.files[0])}
                  />
                </label>
                {uploads[qIndex] && (
                  <span style={{ fontSize: "0.85rem", color: "#48bb78" }}>
                    ✅ {uploads[qIndex]}
                  </span>
                )}
              </div>
            </div>
          ))}

          {!submitted ? (
            <div style={{ marginTop: "30px", padding: "20px", background: "#f8fafc", borderRadius: "15px", border: "1px solid #e2e8f0" }}>
              <button
                onClick={submitTest}
                className="generate-btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "18px",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <FaCloudUploadAlt /> Submit Test Answers
              </button>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                background: "linear-gradient(135deg, #f0fff4 0%, #d4f7e2 100%)",
                color: "#276749",
                borderRadius: "25px",
                marginTop: "40px",
                boxShadow: "0 10px 30px rgba(39, 103, 73, 0.1)",
                border: "1px solid #c6f6d5"
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "15px", textShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>🎉</div>
              <h3 style={{ marginBottom: "15px", fontSize: "1.8rem", fontWeight: "700" }}>Test Completed Successfully!</h3>

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
                  <span style={{ fontWeight: "800", color: "#48bb78", fontSize: "1.2rem" }}>+20 XP</span>
                </div>
              </div>

              <p style={{ fontSize: "1.1rem", opacity: "0.9" }}>
                Your subjective answers have been recorded.
                {user && user.parentEmail && " A progress report has been emailed to your parent."}
              </p>
              
            </div>
          )}
        </div>
      )}

      {!loading && questions.length === 0 && !error && !displayTopic && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>
            Please search for a topic in the <strong>Study Plan</strong> page to generate a full
            mock test.
          </p>
        </div>
      )}
    </div>
  );
};

export default Test;

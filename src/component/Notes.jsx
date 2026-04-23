import React, { useState, useEffect, useCallback } from "react";
import { FaBookOpen, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTopic } from "../TopicContext";
import "./Notes.css";

const Notes = ({ user, updateUser }) => {
  const { currentTopic, syncStatus } = useTopic();
  const [content, setContent] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [displayTopic, setDisplayTopic] = useState("");

  
  useEffect(() => {
    if (currentTopic) {
      setDisplayTopic(currentTopic);
      const cachedNotes = localStorage.getItem(`notes_${currentTopic}`);
      const cachedPlan = localStorage.getItem(`plan_${currentTopic}`);

      if (cachedPlan) {
        try { setTimetable(JSON.parse(cachedPlan)); } catch { }
      }

      if (cachedNotes) {
        setContent(cachedNotes);
        setLoading(false);
      } else if (syncStatus.notes === "loading") {
        setLoading(true);
        setContent("");
      } else {
        setLoading(false);
      }
    }
  }, [currentTopic, syncStatus.notes]);

  useEffect(() => {
    const onContentUpdate = (e) => {
      if (e.detail.topic === currentTopic && e.detail.type === "notes") {
        const cached = localStorage.getItem(`notes_${currentTopic}`);
        if (cached) setContent(cached);
        setLoading(false);
      }
    };
    window.addEventListener('contentUpdated', onContentUpdate);
    return () => window.removeEventListener('contentUpdated', onContentUpdate);
  }, [currentTopic]);


  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const topic = displayTopic || currentTopic || "uploaded";
      localStorage.setItem(`notes_${topic}`, text);
      setContent(text);
      setDisplayTopic(topic);
      setError("");
      setLoading(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  
  const renderNotesContent = () => {
    if (!content) return null;

    
    if (timetable.length > 0) {
      
      const lines = content.split(/\n/).filter(l => l.trim());
      return (
        <div className="notes-sections">
          {timetable.map((task, idx) => {
            const subtopic = task.topic || task.task;
            
            return (
              <div key={idx} className="notes-subtopic-card">
                <div className="notes-subtopic-header">
                  <span className="notes-step-badge">{idx + 1}</span>
                  <span className="notes-subtopic-title">{subtopic}</span>
                  <span className="notes-duration-tag">{parseInt(task.time) || 45} mins</span>
                </div>
                <div className="notes-subtopic-body">
                  {}
                  {renderSubtopicContent(content, subtopic, idx, timetable.length)}
                </div>
              </div>
            );
          })}

          {}
          <div className="notes-full-section">
            <h3 className="notes-full-title">📝 Complete Notes</h3>
            <pre className="notes-full-text">{content}</pre>
          </div>
        </div>
      );
    }

    
    return (
      <div className="plan-table-wrapper" style={{ padding: "40px", lineHeight: "1.8", whiteSpace: "pre-wrap", fontSize: "1.05rem" }}>
        {content}
      </div>
    );
  };

  
  function renderSubtopicContent(fullText, subtopic, idx, total) {
    if (!fullText) return <p style={{ whiteSpace: "pre-wrap", color: "#4a5568", lineHeight: "1.8" }}>Content generating…</p>;

    
    const lines = fullText.split("\n");
    
    const subtopicWords = subtopic.split(/[\s,:-]+/).filter(w => w.length > 3);
    const keywordRegex = subtopicWords.length > 0
      ? new RegExp(subtopicWords.slice(0, 3).join("|"), "i")
      : new RegExp(subtopic.split(" ").slice(0, 2).join("|"), "i");

    const sectionLines = [];
    let inSection = false;
    let foundStart = false;

    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      
      if (!inSection && keywordRegex.test(line) && line.trim().length < 150) {
        inSection = true;
        foundStart = true;
      }

      if (inSection) {
        sectionLines.push(line);

        
        if (sectionLines.length > 2 && /^(?:[1-9]\.|\*|\#|-[a-zA-Z])/.test(line) && i > 0 && !keywordRegex.test(line)) {
          
          break;
        }
        if (sectionLines.length >= 8) break; 
      }
    }

    if (foundStart && sectionLines.length > 0) {
      return <p style={{ whiteSpace: "pre-wrap", color: "#4a5568", lineHeight: "1.8" }}>{sectionLines.join("\n")}</p>;
    }

    
    const allLines = fullText.split("\n").filter(l => l.trim().length > 0);
    
    if (allLines.length === 0) {
      return <p style={{ whiteSpace: "pre-wrap", color: "#4a5568", lineHeight: "1.8" }}>Content generating…</p>;
    }

    const linesPerSection = Math.max(1, Math.floor(allLines.length / total));

    
    if (allLines.length <= total && idx === 0) {
      return <p style={{ whiteSpace: "pre-wrap", color: "#4a5568", lineHeight: "1.8" }}>{allLines.join("\n")}</p>;
    }

    const start = idx * linesPerSection;
    const end = (idx === total - 1) ? allLines.length : start + linesPerSection; 
    const slice = allLines.slice(start, end).join("\n");

    return <p style={{ whiteSpace: "pre-wrap", color: "#4a5568", lineHeight: "1.8" }}>{slice || "Content generating…"}</p>;
  }

  return (
    <div className="study-plan-container">
      <div className="top-nav">
        <Link to="/" className="back-btn">
          <FaArrowLeft /> Back to Home
        </Link>
      </div>

      <div className="study-plan-header">
        <FaBookOpen className="header-icon" />
        <h2>📚 Study Notes</h2>
        <p>
          {displayTopic
            ? <>Notes for: <strong>{displayTopic}</strong> — based on your study timetable</>
            : "Search a topic in Study Plan to get structured notes."}
        </p>

        <label
          htmlFor="notes-upload"
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            marginTop: "12px", cursor: "pointer",
            background: "var(--primary-color, #6c63ff)", color: "#fff",
            padding: "8px 20px", borderRadius: "20px",
            fontSize: "0.9rem", fontWeight: "600",
            boxShadow: "0 2px 10px rgba(108,99,255,0.3)", transition: "opacity 0.2s",
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          ⬆️ Upload Notes (.txt)
          <input id="notes-upload" type="file" accept=".txt" style={{ display: "none" }} onChange={handleUpload} />
        </label>
      </div>

      {loading && !content && (
        <div className="loading-overlay">
          <div className="spinner-large" style={{ margin: "0 auto" }}></div>
          <p style={{ marginTop: "20px", color: "var(--primary-color)", fontWeight: "600" }}>
            AI is writing your timetable-based notes…
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="error-message-container">
          <div className="error-message">{error}</div>
        </div>
      )}

      {!loading && content && renderNotesContent()}

      {!loading && !content && !displayTopic && (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>
            No active topic found. Go to <strong>Study Plan</strong> to generate your timetable first!
          </p>
        </div>
      )}
    </div>
  );
};

export default Notes;

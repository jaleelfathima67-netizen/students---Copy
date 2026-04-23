import React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUserCircle,
  FaCalendarAlt,
  FaClipboardList,
  FaQuestionCircle,
  FaFlask,
  FaBookOpen,
  FaFire,
  FaStar,
  FaSearch
} from "react-icons/fa";
import { useTopic } from "../TopicContext";
import "./FrontPage.css";

const FrontPage = () => {
  const { setCurrentTopic, triggerSequentialGeneration } = useTopic();
  const [currentTopic, setCurrentTopicLocal] = React.useState(localStorage.getItem("currentStudyTopic") || "");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const savedProfile = localStorage.getItem("profile");
    if (savedProfile) {
      setUser(JSON.parse(savedProfile).result);
    }

    const handleUpdate = () => {
      setCurrentTopicLocal(localStorage.getItem("currentStudyTopic") || "");
      const updatedProfile = localStorage.getItem("profile");
      if (updatedProfile) setUser(JSON.parse(updatedProfile).result);
      else setUser(null);
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("topicUpdated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("topicUpdated", handleUpdate);
    };
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (!user) {
      alert("Please login or register to start learning with a personalized study plan!");
      navigate("/login");
      return;
    }

    setCurrentTopic(trimmed);
    triggerSequentialGeneration(trimmed);
    navigate("/studyplan");
  };

  return (
    <div className="fp-container">

      {}
      <header className="fp-navbar">
        <div className="fp-profile">
          <Link to="/profile">
            <FaUserCircle className="fp-profile-icon" />
          </Link>
          <span>Hi, {user ? user.name : "Student"} 👋</span>
        </div>

        <nav className="fp-nav-links">
          <Link to="/rank">Rank</Link>
          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          ) : (
            <Link to="/profile">Profile</Link>
          )}
        </nav>
      </header>

      {}
      <section className="fp-ai-card">
        <h2>🤖 AI Recommendation</h2>
        {currentTopic ? (
          <>
            <p>
              You're currently mastering <b>{currentTopic}</b>.
              Keep up the momentum and complete your daily goals!
            </p>
            <Link to="/studyplan" className="fp-primary-btn">
              View Study Plan
            </Link>
          </>
        ) : (
          <>
            <p>
              Ready to learn something new? Enter a topic to generate a personalized study roadmap!
            </p>
            <form className="fp-search-bar" onSubmit={handleSearch}>
              <FaSearch className="fp-search-icon" />
              <input
                type="text"
                placeholder="What do you want to learn today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Start Learning</button>
            </form>
            <div className="fp-auth-btns">
              {!user && (
                <>
                  <Link to="/signup" className="fp-secondary-btn">
                    Register to Track Marks
                  </Link>
                  <Link to="/login" className="fp-secondary-btn guest-login">
                    Login
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {}
      <section className="fp-today">
        <div>
          <h3>📋 Today’s Focus</h3>
          <p>Tasks: <b>3 / 5</b></p>
          <p>Estimated Time: <b>1h 40m</b></p>
        </div>
        <Link to="/daily_plan" className="fp-secondary-btn">
          Resume
        </Link>
      </section>

      {}
      <section className="fp-stats">
        <div className="fp-stat-card">
          <FaFire /> <span>5 Day Streak</span>
        </div>
        <div className="fp-stat-card">
          <FaBookOpen /> <span>12 Topics Done</span>
        </div>
        <div className="fp-stat-card">
          <FaStar /> <span>3 Badges</span>
        </div>
      </section>

      {}
      <section className="fp-features">
        <Link to="/studyplan" className="fp-card">
          <FaCalendarAlt />
          <h4>Study Plan</h4>
          <p>Personalized study tracer</p>
        </Link>

        <Link to="/quiz" className="fp-card">
          <FaQuestionCircle />
          <h4>Quiz</h4>
          <p>Practice & improve</p>
        </Link>

        <Link to="/test" className="fp-card">
          <FaFlask />
          <h4>Test</h4>
          <p>Check your level</p>
        </Link>

        <Link to="/notes" className="fp-card">
          <FaClipboardList />
          <h4>Notes</h4>
          <p>Quick revision</p>
        </Link>
      </section>

      {}
      <footer className="fp-footer">
        ⭐ Keep going, consistency beats motivation!
      </footer>
    </div>
  );
};

export default FrontPage;

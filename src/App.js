import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";

import FrontPage from "./component/FrontPage.jsx";
import DailyPlan from "./component/DailyPlan.jsx";
import Quiz from "./component/Quiz.jsx";
import Test from "./component/Test.jsx";
import Notes from "./component/Notes.jsx";
import Rank from "./component/Rank.jsx";
import Login from "./component/Login.jsx";
import Signup from "./component/Signup.jsx";
import Profile from "./component/Profile.jsx";
import StudyPlan from "./component/StudyPlan.jsx";
import AIChat from "./component/AIChat.jsx";
import "./App.css";


const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Login onLoginSuccess={() => window.location.reload()} />; 
  }
  return children;
};


function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedProfile = localStorage.getItem("profile");
    if (savedProfile) {
      setUser(JSON.parse(savedProfile).result);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    navigate("/profile");
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    const profile = JSON.parse(localStorage.getItem("profile"));
    if (profile) {
      profile.result = updatedUser;
      localStorage.setItem("profile", JSON.stringify(profile));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("profile");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="app-main">
      {window.location.pathname !== "/" && (
        <nav className="navbar">
          <Link to="/">Home</Link>
          <Link to="/studyplan" className="nav-highlight">Study Plan</Link>
          <Link to="/aichat" className="nav-online">Online Assistant</Link>
          {user ? (
            <>
              <Link to="/profile">Profile ({user.name})</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </nav>
      )}

      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/daily_plan" element={<DailyPlan />} />
        <Route path="/quiz" element={<ProtectedRoute user={user}><Quiz user={user} updateUser={handleUpdateUser} /></ProtectedRoute>} />
        <Route path="/test" element={<ProtectedRoute user={user}><Test user={user} updateUser={handleUpdateUser} /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute user={user}><Notes user={user} updateUser={handleUpdateUser} /></ProtectedRoute>} />
        <Route path="/rank" element={<Rank />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<Signup onSignupSuccess={() => navigate("/login")} />} />
        <Route path="/profile" element={<ProtectedRoute user={user}><Profile user={user} /></ProtectedRoute>} />
        <Route path="/studyplan" element={<StudyPlan user={user} updateUser={handleUpdateUser} />} />
        <Route path="/aichat" element={<ProtectedRoute user={user}><AIChat user={user} /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;
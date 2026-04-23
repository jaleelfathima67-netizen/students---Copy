import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrophy, FaMedal, FaCrown } from "react-icons/fa";
import "./Rank.css";

const Rank = () => {
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get("/api/user/leaderboard");
        setRanks(response.data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <FaCrown className="rank-icon crown" />;
      case 1: return <FaMedal className="rank-icon silver" />;
      case 2: return <FaMedal className="rank-icon bronze" />;
      default: return <span className="rank-number">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="rank-loading">
        <div className="spinner-large"></div>
        <p>Calculating rankings...</p>
      </div>
    );
  }

  return (
    <div className="rank-container">
      <div className="rank-header">
        <FaTrophy className="rank-header-icon" />
        <h2>Leaderboard Top 10</h2>
        <p>Compete with your peers and climb to the top!</p>
      </div>

      <div className="rank-table-wrapper">
        <table className="rank-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student Name</th>
              <th>Grade</th>
              <th>Total Marks</th>
            </tr>
          </thead>
          <tbody>
            {ranks.length > 0 ? (
              ranks.map((learner, index) => (
                <tr key={learner._id || index} className={`rank-row row-${index}`}>
                  <td className="rank-td-icon">{getRankIcon(index)}</td>
                  <td className="rank-td-name">{learner.name}</td>
                  <td className="rank-td-grade">Grade {learner.grade}</td>
                  <td className="rank-td-score">
                    <span className="score-badge">{learner.marks || 0}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="rank-empty">No rankings available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Rank;

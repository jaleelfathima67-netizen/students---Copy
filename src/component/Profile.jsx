import React from "react";
import "./Profile.css";

const Profile = ({ user }) => {
  if (!user) {
    return <div className="profileContainer"><h2>Please login to view your profile.</h2></div>;
  }

  return (
    <div className="profileContainer">
      <h2>👤 My Profile</h2>

      <div className="profileCard">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Grade:</strong> {user.grade}</p>
        <p><strong>Total Marks:</strong> {user.marks || 0}</p>
        <div className="badges-section">
          <h3>Achievements:</h3>
          {user.badges && user.badges.length > 0 ? (
            <div className="badges-list">
              {user.badges.map((badge, index) => (
                <span key={index} className="badge-item">🏅 {badge}</span>
              ))}
            </div>
          ) : (
            <p>No badges earned yet. Keep studying!</p>
          )}
        </div>
        <div className="completed-tasks">
          <h3>Completed Tasks:</h3>
          {user.completedTasks && user.completedTasks.length > 0 ? (
            <ul>
              {user.completedTasks.map((task, index) => (
                <li key={index}>{task.taskName} - {new Date(task.completedAt).toLocaleDateString()}</li>
              ))}
            </ul>
          ) : (
            <p>No tasks completed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

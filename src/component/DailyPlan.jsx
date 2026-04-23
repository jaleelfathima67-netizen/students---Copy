import React, { useState } from "react";
import "./DailyPlan.css";

const DailyPlan = () => {
  const [tasks, setTasks] = useState([]);
  const [prompt, setPrompt] = useState("");

  const generatePlan = async () => {
    if (!prompt) return alert("Please enter a topic");

    try {
      const res = await fetch("/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
      else alert("AI returned invalid data");

    } catch (error) {
      console.error("Frontend error:", error);
      alert("Error generating AI plan. Check backend.");
    }
  };

  return (
    <div className="dailyPlanContainer">
      <h2>📅 Today's Study Plan</h2>

      <input
        type="text"
        placeholder="Enter topic..."
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />

      <button type="button" onClick={generatePlan}>
        Generate Timetable
      </button>

      {tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <table className="taskTable">
          <thead>
            <tr>
              <th>Time</th>
              <th>Topic</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let accumulatedMinutes = 9 * 60;
              return tasks.map((task, i) => {
                const startHour = Math.floor(accumulatedMinutes / 60);
                const startMin = accumulatedMinutes % 60;
                accumulatedMinutes += task.time;
                const endHour = Math.floor(accumulatedMinutes / 60);
                const endMin = accumulatedMinutes % 60;

                const formatTime = (h, m) =>
                  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

                return (
                  <tr key={i}>
                    <td>{`${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`}</td>
                    <td>{task.topic}</td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DailyPlan;
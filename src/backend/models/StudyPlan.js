const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  subject: { type: String, required: true },
  tasks: [
    {
      topic: String,
      time: Number,
      status: { type: String, default: "pending" },
      dailyPlan: String

    }
  ],
     weakTopics: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("StudyPlan", studyPlanSchema);


const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
   status: { type: String, default: "pending" }
});

const QuizPlanSchema = new mongoose.Schema({
  questions: [QuestionSchema]
});

module.exports = mongoose.model("QuizePlans", QuizPlanSchema);

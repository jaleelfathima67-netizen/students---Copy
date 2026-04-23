const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
  subject: { type: String, required: true }, 
  questions: [
    {
      question: { type: String, required: true },
      options: [{ type: String, required: true }],
      answer: { type: String, required: true },
    }
  ], status: { type: String, default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Test", testSchema);

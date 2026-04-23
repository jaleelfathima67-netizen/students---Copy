const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
   status: { type: String, default: "pending" }
});

module.exports = mongoose.model("Note", noteSchema);

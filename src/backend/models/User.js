import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    grade: {
        type: Number,
        required: true,
    },
    parentEmail: {
        type: String,
    },
    marks: {
        type: Number,
        default: 0,
    },
    completedTasks: [
        {
            taskId: String,
            taskName: String,
            completedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    badges: [{ type: String }],
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;

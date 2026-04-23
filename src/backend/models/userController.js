import User from "./User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



export const signup = async (req, res) => {
    try {
        const { name, age, email, password, grade, parentEmail } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            name,
            age,
            email,
            password: hashedPassword,
            grade,
            parentEmail
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Signup backend error:", error);
        res.status(500).json({ message: error.message });
    }
};




export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, "test_secret", { expiresIn: "1h" });

        res.status(200).json({ result: user, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const updateProgress = async (req, res) => {
    try {
        const { userId, taskId, taskName, marks, type, parentEmail, reportData } = req.body; 
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (type === 'task') {
            user.marks += marks || 10;
            user.completedTasks.push({ taskId, taskName });
        } else if (type === 'quiz' || type === 'test') {
            user.marks += marks || 0;
        }

        
        const newBadges = [];
        if (user.completedTasks.length >= 5 && !user.badges.includes("Quick Learner")) {
            newBadges.push("Quick Learner");
        }
        if (user.marks >= 100 && !user.badges.includes("High Achiever")) {
            newBadges.push("High Achiever");
        }
        if (user.completedTasks.length >= 10 && !user.badges.includes("Pro Solver")) {
            newBadges.push("Pro Solver");
        }
        if (user.marks >= 500 && !user.badges.includes("Top Scorer")) {
            newBadges.push("Top Scorer");
        }

        if (newBadges.length > 0) {
            user.badges.push(...newBadges);
        }

        if (parentEmail) {
            user.parentEmail = parentEmail;
        }

        await user.save();


        res.status(200).json({ message: "Progress updated", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getLeaderboard = async (req, res) => {
    try {
        const topUsers = await User.find({}, "name email marks grade")
            .sort({ marks: -1 })
            .limit(10);
        res.status(200).json(topUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


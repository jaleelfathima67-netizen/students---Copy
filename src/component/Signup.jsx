import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; 

const Signup = ({ onSignupSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        email: '',
        password: '',
        grade: '',
        parentEmail: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/auth/signup', formData); 
            onSignupSuccess();
        } catch (err) {
            console.error("Signup error:", err.response?.data);
            setError(err.response?.data?.message || 'Signup failed. Please check your data or try another email.');
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Sign Up</h2>
                {error && <p className="error-message">{error}</p>}
                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="grade"
                    placeholder="Grade (Class)"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="parentEmail"
                    placeholder="Parent's Email Address"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Sign Up</button>
                <p className="auth-link">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;

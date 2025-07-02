// src/login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// Error utility function
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [loginMessage, setLoginMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage("");
    if (!validateForm()) return;
  
    setIsLoading(true);
    console.log("→ /api/login payload:", {
      userLogin: username,
      passLogin: password
    });
    
    try {
      // Single-origin login to your Hostinger backend
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userLogin: username,  // match server’s req.body.userLogin
          passLogin: password   // match server’s req.body.passLogin
        })
      });
  
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          errBody.error ||
          errBody.message ||
          `Login failed (${response.status})`
        );
      }
  
      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      navigate("/dashboard");
  
    } catch (err) {
      const msg = getErrorMessage(err as unknown);
      console.error("Login error:", err);
      setLoginMessage(
        msg.includes("Failed to fetch")
          ? "Cannot connect to server. Please check if backend is running."
          : msg
      );
  
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to IZYS</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              placeholder="Enter your username"
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className={errors.username ? "error-input" : ""}
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={errors.password ? "error-input" : ""}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={isLoading ? "loading" : ""}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        {loginMessage && (
          <p className={`login-message ${loginMessage.toLowerCase().includes("error") ? "error" : ""}`}>
            {loginMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
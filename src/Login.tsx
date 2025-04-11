// src/login.tsx
import React, { useState, useEffect } from "react";
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

  // Connection diagnostics
  useEffect(() => {
    const testConnection = async () => {
      const endpoints = [
        'http://localhost:5000/api/symbols',
        'http://127.0.0.1:5000/api/symbols',
        `http://${window.location.hostname}:5000/api/symbols`
      ];

      for (const url of endpoints) {
        try {
          const start = Date.now();
          const res = await fetch(url);
          console.log(`✅ ${url} responded in ${Date.now() - start}ms (Status: ${res.status})`);
          return;
        } catch (err) {
          console.log(`❌ ${url} failed:`, getErrorMessage(err));
        }
      }
      console.error('All connection attempts failed');
    };
    testConnection();
  }, []);

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

    try {
      // Try multiple endpoints
      const endpoints = [
        'http://localhost:5000/api/login',
        'http://127.0.0.1:5000/api/login',
        `http://${window.location.hostname}:5000/api/login`
      ];

      let response;
      let lastError;

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          if (response.ok) break;
        } catch (err) {
          lastError = err;
          console.warn(`Attempt failed for ${endpoint}:`, getErrorMessage(err));
        }
      }

      if (!response) {
        throw lastError || new Error("Could not connect to any server endpoints");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      localStorage.setItem("authToken", data.token);
      navigate("/dashboard");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Login error:", error);
      setLoginMessage(errorMessage.includes("Failed to fetch") 
        ? "Cannot connect to server. Please check if backend is running."
        : errorMessage
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
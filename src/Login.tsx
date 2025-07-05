// src/login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import './styles/theme.css';

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
      // Use relative /api/login so Vite proxy works in dev
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userLogin: username,  // match server's req.body.userLogin
          passLogin: password   // match server's req.body.passLogin
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
      window.dispatchEvent(new Event("authChanged"));
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
  
  // Responsive: add horizontal padding for mobile
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{
        background: 'var(--color-card)',
        borderRadius: 16,
        boxShadow: '0 4px 32px var(--color-shadow)',
        padding: '2.5rem 2rem',
        maxWidth: 380,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Logo/Brand */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-green)' }} />
          <span style={{ color: 'var(--color-text-main)', fontWeight: 700, fontSize: 24, letterSpacing: 1 }}>IZYS</span>
        </div>
        <h2 style={{ color: 'var(--color-text-main)', fontWeight: 600, fontSize: 22, marginBottom: 18 }}>Sign in to Dashboard</h2>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: 18 }}>
            <input
              type="text"
              id="username"
              value={username}
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-sidebar)',
                color: 'var(--color-text-main)',
                fontSize: 16,
                outline: 'none',
                marginBottom: errors.username ? 4 : 0,
              }}
            />
            {errors.username && <span style={{ color: 'var(--color-accent-red)', fontSize: 13 }}>{errors.username}</span>}
          </div>
          <div style={{ marginBottom: 18 }}>
            <input
              type="password"
              id="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-sidebar)',
                color: 'var(--color-text-main)',
                fontSize: 16,
                outline: 'none',
                marginBottom: errors.password ? 4 : 0,
              }}
            />
            {errors.password && <span style={{ color: 'var(--color-accent-red)', fontSize: 13 }}>{errors.password}</span>}
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 8,
              background: 'var(--color-accent-green)',
              color: '#181C23',
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px var(--color-shadow)',
              marginTop: 8,
              transition: 'background 0.2s',
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        {loginMessage && (
          <p style={{ color: loginMessage.toLowerCase().includes("error") ? 'var(--color-accent-red)' : 'var(--color-accent-orange)', marginTop: 18, fontSize: 15, textAlign: 'center' }}>
            {loginMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;

// Vite proxy note:
// If you use /api/login as a relative path, make sure vite.config.ts has a proxy for /api to your backend.
// This allows local dev to work with CORS automatically.
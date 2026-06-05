// src/pages/AuthPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");       // login | signup
  const [role, setRole] = useState("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        await signup(email, password, name, role);
      } else {
        await login(email, password);
      }
      // AuthContext will redirect via App router
      navigate(role === "admin" ? "/admin" : "/tests");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 100%)", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 52, height: 52, background: "var(--blue)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 4px 14px rgba(26,86,219,.35)" }}>
            <span style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>P</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>ProctorDesk</div>
          <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>Secure Assessment Platform</div>
        </div>

        <div className="card card-lg" style={{ padding: "2rem" }}>
          {/* Role selector */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="input-label" style={{ marginBottom: 8 }}>Sign in as</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["admin", "candidate"].map(r => (
                <button key={r} onClick={() => setRole(r)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", ...(role === r ? { background: "var(--blue-light)", borderColor: "var(--blue)", color: "var(--blue)" } : {}) }}>
                  {r === "admin" ? "🛡️ Admin" : "👤 Candidate"}
                </button>
              ))}
            </div>
          </div>

          {/* Mode tabs */}
          <div style={{ display: "flex", background: "var(--gray-light)", borderRadius: 8, padding: 3, marginBottom: "1.25rem" }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, background: mode === m ? "var(--card)" : "transparent", color: mode === m ? "var(--text)" : "var(--gray)", boxShadow: mode === m ? "var(--shadow)" : "none", transition: "all .15s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="field">
                <label className="input-label">Full Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
              </div>
            )}
            <div className="field">
              <label className="input-label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field" style={{ marginBottom: error ? 12 : 0 }}>
              <label className="input-label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            {error && (
              <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Please wait…" : mode === "login" ? "Continue →" : "Create Account →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--gray)", marginTop: 16 }}>
          By continuing, you agree to ProctorDesk's Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}

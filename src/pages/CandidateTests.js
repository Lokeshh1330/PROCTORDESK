// src/pages/CandidateTests.js
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CandidateTests() {
  const { currentUser, logout } = useAuth();
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "tests"), where("isActive", "==", true));
    const unsub = onSnapshot(q, snap => {
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/auth");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "var(--card)", borderBottom: "0.5px solid var(--border)", height: 56, display: "flex", alignItems: "center", padding: "0 1.5rem", gap: 10 }}>
        <div style={{ width: 26, height: 26, background: "var(--blue)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>P</div>
        <span style={{ fontWeight: 800, fontSize: 15 }}>ProctorDesk</span>
        <span style={{ color: "var(--border)", margin: "0 6px" }}>|</span>
        <span style={{ fontSize: 13, color: "var(--gray)" }}>Candidate Portal</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--gray)" }}>👤 {currentUser?.displayName}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Available Assessments</h1>
          <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>Select a test below to begin. Make sure you are in a quiet environment.</p>
        </div>

        {tests.length === 0 && (
          <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--gray)" }}>
            No assessments assigned to you yet.
          </div>
        )}

        {tests.map(t => (
          <div key={t.id} className="card" style={{ padding: "1.25rem 1.5rem", marginBottom: 12, display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, background: "var(--blue-light)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>☕</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4, display: "flex", gap: 12 }}>
                <span>📋 {t.questions?.length || 0} questions</span>
                <span>⏱ {t.duration} minutes</span>
                <span>🎯 Pass: {t.passScore}%</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(`/take/${t.id}`)}>Start →</button>
          </div>
        ))}
      </main>
    </div>
  );
}

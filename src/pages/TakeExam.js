// src/pages/TakeExam.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useProctoring } from "../hooks/useProctoring";
import Editor from "@monaco-editor/react";

// ── Sub-components ──────────────────────────────

function FullscreenGate({ onEnter }) {
  return (
    <div className="fullscreen-gate">
      <div className="gate-box">
        <div style={{ fontSize: 52, marginBottom: "1rem" }}>⛶</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Fullscreen Required</h2>
        <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          This exam must run in fullscreen mode. Exiting fullscreen, switching tabs, or losing window focus will be recorded as violations and reported to the administrator.
        </p>
        <div style={{ background: "var(--red-light)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: "1.5rem", textAlign: "left" }}>
          <strong>Anti-cheat measures active:</strong><br />
          • Fullscreen lock · Tab switch detection<br />
          • Copy/paste disabled · Webcam monitoring<br />
          • All violations logged to admin in real time
        </div>
        <button className="btn btn-primary btn-full btn-lg" onClick={onEnter}>
          Enter Fullscreen & Start Exam
        </button>
      </div>
    </div>
  );
}

function Timer({ timeLeft, duration }) {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");
  const urgent = timeLeft < 300;
  const critical = timeLeft < 60;
  return (
    <div style={{ padding: "5px 16px", borderRadius: 20, fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums", background: critical ? "var(--red)" : urgent ? "var(--amber-light)" : "var(--blue-light)", color: critical ? "#fff" : urgent ? "var(--amber)" : "var(--blue)" }}>
      ⏱ {m}:{s}
    </div>
  );
}

// ── Main Exam Page ──────────────────────────────

export default function TakeExam() {
  const { testId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState([]);
  const [showViolationBanner, setShowViolationBanner] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [fsPrompt, setFsPrompt] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const videoRef = useRef(null);

  const { startWebcam, stopWebcam, requestFullscreen, logViolation } = useProctoring({
    enabled: started && !submitted,
    candidateName: currentUser?.displayName || "Candidate",
    candidateEmail: currentUser?.email || "",
    testId,
    testTitle: test?.title || "",
    onViolation: useCallback((type) => {
      setViolations(prev => {
        const next = [...prev, { type, time: new Date() }];
        setShowViolationBanner(true);
        setTimeout(() => setShowViolationBanner(false), 4000);
        return next;
      });
      // Re-prompt fullscreen on exit
      if (type === "fullscreen") setFsPrompt(true);
    }, []),
  });

  // Load test
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "tests", testId));
        if (!snap.exists()) { setError("Test not found."); return; }
        setTest({ id: snap.id, ...snap.data() });
        setTimeLeft((snap.data().duration || 45) * 60);
      } catch {
        setError("Failed to load test. Check your connection.");
      }
      setLoading(false);
    }
    load();
  }, [testId]);

  // Timer
  useEffect(() => {
    if (!started || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, submitted]);

  async function handleStart() {
    await requestFullscreen();
    const wReady = await startWebcam(videoRef.current);
    setWebcamReady(wReady);
    setStarted(true);
    startTimeRef.current = Date.now();
    setFsPrompt(false);
  }

  async function handleSubmit(auto = false) {
    if (submitted) return;
    if (!auto && !window.confirm("Submit your exam? This cannot be undone.")) return;
    clearInterval(timerRef.current);
    setSubmitted(true);
    stopWebcam();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    const timeUsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
    const totalPoints = test.questions.reduce((s, q) => s + (q.points || 10), 0);
    const answered = Object.keys(answers).length;
    const score = Math.round((answered / test.questions.length) * 100);

    await addDoc(collection(db, "results"), {
      testId, testTitle: test.title, passScore: test.passScore,
      candidateName: currentUser?.displayName || "Candidate",
      candidateEmail: currentUser?.email || "",
      candidateUid: currentUser?.uid,
      answers, score, violations: violations.length,
      timeUsed, totalPoints, answered,
      submittedAt: serverTimestamp(),
    });
  }

  // ── Loading / error states ──
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 16, color: "var(--gray)" }}>Loading exam…</div>;
  if (error) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: "1rem" }}>❌</div><div style={{ fontSize: 16, color: "var(--red)" }}>{error}</div></div></div>;

  // ── Submitted screen ──
  if (submitted) {
    const score = Math.round((Object.keys(answers).length / test.questions.length) * 100);
    const passed = score >= test.passScore;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "2rem" }}>
        <div className="card card-lg" style={{ padding: "2.5rem", maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: passed ? "var(--green-light)" : "var(--red-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 1.25rem" }}>
            {passed ? "✅" : "❌"}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Exam Submitted!</h2>
          <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: "1.5rem" }}>
            {passed ? "Congratulations! You passed the assessment." : "You did not meet the passing score. Please check with your administrator."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
            {[
              { label: "Score", value: score + "%", color: passed ? "var(--green)" : "var(--red)" },
              { label: "Violations", value: violations.length, color: violations.length > 0 ? "var(--red)" : "var(--green)" },
              { label: "Answered", value: `${Object.keys(answers).length}/${test.questions.length}` },
              { label: "Status", value: passed ? "PASS" : "FAIL", color: passed ? "var(--green)" : "var(--red)" },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "12px" }}>
                <div style={{ fontSize: 11, color: "var(--gray)", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color || "var(--text)" }}>{s.value}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-full" onClick={() => navigate("/auth")}>Exit</button>
        </div>
      </div>
    );
  }

  // ── Pre-start screen ──
  if (!started) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "2rem" }}>
        <div className="card card-lg" style={{ padding: "2.5rem", maxWidth: 480, width: "100%" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
              <div style={{ width: 44, height: 44, background: "var(--blue-light)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>☕</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{test.title}</div>
                <div style={{ fontSize: 12, color: "var(--gray)" }}>{test.questions.length} questions · {test.duration} min · Pass: {test.passScore}%</div>
              </div>
            </div>
            {test.instructions && <p style={{ fontSize: 14, color: "var(--gray)", lineHeight: 1.6, marginBottom: "1rem" }}>{test.instructions}</p>}
          </div>
          <div style={{ background: "var(--red-light)", borderRadius: 10, padding: "14px", marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 700, color: "var(--red)", marginBottom: 6 }}>⚠️ Important — Read Before Starting</div>
            <ul style={{ fontSize: 13, color: "var(--red)", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
              <li>Fullscreen mode will be enforced</li>
              <li>Tab switching is detected and logged</li>
              <li>Copy & paste is disabled</li>
              <li>Your webcam will be activated for monitoring</li>
              <li>All violations are reported to the admin instantly</li>
              <li>Timer starts immediately after you click Start</li>
            </ul>
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={handleStart}>
            🚀 Start Exam
          </button>
        </div>
      </div>
    );
  }

  // ── Active exam ──
  const q = test.questions[currentQ];
  const total = test.questions.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Fullscreen re-prompt */}
      {fsPrompt && <FullscreenGate onEnter={handleStart} />}

      {/* Violation banner */}
      {showViolationBanner && (
        <div className="violation-banner">
          <span>⚠️</span>
          <span>Violation detected — Admin notified in real time</span>
          <span style={{ marginLeft: "auto", background: "rgba(255,255,255,.2)", padding: "2px 10px", borderRadius: 12, fontSize: 12 }}>
            {violations.length} violation{violations.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Top bar */}
      <header style={{ background: "var(--card)", borderBottom: "0.5px solid var(--border)", height: 52, display: "flex", alignItems: "center", padding: "0 1.25rem", gap: "1rem", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, background: "var(--blue)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>P</div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>ProctorDesk</span>
        </div>
        <span style={{ color: "var(--border)" }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.title}</span>
        <Timer timeLeft={timeLeft} duration={test.duration * 60} />
        {violations.length > 0 && (
          <span className="badge badge-red">{violations.length} violations</span>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => handleSubmit(false)}>Submit</button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr", overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{ borderRight: "0.5px solid var(--border)", padding: "1rem", background: "var(--card)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Questions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {test.questions.map((_, i) => (
                <button key={i} onClick={() => setCurrentQ(i)} style={{ aspectRatio: "1", borderRadius: 7, border: "0.5px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", borderColor: i === currentQ ? "var(--blue)" : answers[i] ? "var(--green)" : "var(--border)", background: i === currentQ ? "var(--blue)" : answers[i] ? "var(--green-light)" : "transparent", color: i === currentQ ? "#fff" : answers[i] ? "var(--green)" : "var(--text)" }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--gray)" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}><span style={{ width: 12, height: 12, background: "var(--blue)", borderRadius: 3, display: "inline-block" }} />Current</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ width: 12, height: 12, background: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 3, display: "inline-block" }} />Answered</div>
          </div>
          <div style={{ background: "var(--red-light)", borderRadius: 8, padding: "10px", fontSize: 12, color: "var(--red)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Monitored</div>
            Fullscreen, webcam & behaviour tracking active
          </div>
          {/* webcam pip */}
          <div>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", borderRadius: 8, border: "0.5px solid var(--border)", background: "#000", display: webcamReady ? "block" : "none" }} />
            {webcamReady && <div style={{ fontSize: 10, color: "var(--green)", textAlign: "center", marginTop: 4 }}>🔴 Webcam Active</div>}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ fontSize: 12, color: "var(--gray)" }}>Question {currentQ + 1} of {total}</div>

          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
              <span className="badge badge-blue">Q{currentQ + 1}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Java Coding · {q.points || 10} pts</span>
              {answers[currentQ] && <span className="badge badge-green" style={{ marginLeft: "auto" }}>✓ Answered</span>}
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: "1.25rem" }}>{q.text}</p>

            <div style={{ border: "0.5px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              {/* Editor toolbar */}
              <div style={{ background: "#1e1e2e", padding: "7px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid #333" }}>
                <span style={{ background: "#d97706", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>Java</span>
                <span style={{ fontSize: 12, color: "#888" }}>Code Editor</span>
                <button onClick={() => {
                  const val = answers[currentQ] || q.starterCode || "";
                  document.getElementById("code-output-" + currentQ).textContent =
                    "// Note: Live Java execution requires a backend runtime.\n// Your code has been saved and will be reviewed by the admin.\n\n// Structure check: " +
                    (val.includes("class") ? "✓ Class found" : "⚠ No class declaration") +
                    "\n" + (val.includes("void") || val.includes("return") ? "✓ Method found" : "⚠ No method declaration");
                }} style={{ marginLeft: "auto", background: "#16a34a", color: "#fff", border: "none", borderRadius: 5, padding: "3px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  ▶ Run
                </button>
              </div>
              <Editor
                height="260px"
                language="java"
                theme="vs-dark"
                value={answers[currentQ] || q.starterCode || "public class Solution {\n    // Your code here\n}"}
                onChange={(val) => setAnswers(prev => ({ ...prev, [currentQ]: val }))}
                options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on", contextmenu: false, renderLineHighlight: "line" }}
              />
              <div id={"code-output-" + currentQ} style={{ background: "#0f0f1a", color: "#a6e3a1", padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, minHeight: 44, whiteSpace: "pre" }}>
                // Output will appear here after Run
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: 10 }}>
            {currentQ > 0 && <button className="btn btn-ghost" onClick={() => setCurrentQ(currentQ - 1)}>← Previous</button>}
            {currentQ < total - 1
              ? <button className="btn btn-primary" onClick={() => setCurrentQ(currentQ + 1)}>Next →</button>
              : <button className="btn btn-success" onClick={() => handleSubmit(false)}>Submit Exam ✓</button>
            }
          </div>
        </main>
      </div>
    </div>
  );
}

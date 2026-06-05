// src/pages/admin/Tests.js
import React, { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: "1rem" }}>
      <div className="card card-lg" style={{ width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", padding: "1.75rem" }}>
        {children}
      </div>
    </div>
  );
}

function QuestionBuilder({ questions, onChange }) {
  function update(idx, field, val) {
    const qs = questions.map((q, i) => i === idx ? { ...q, [field]: val } : q);
    onChange(qs);
  }
  function add() {
    onChange([...questions, { text: "", starterCode: "", hints: "", points: 10 }]);
  }
  function remove(idx) {
    onChange(questions.filter((_, i) => i !== idx));
  }
  return (
    <div>
      {questions.map((q, i) => (
        <div key={i} style={{ background: "var(--gray-light)", borderRadius: 10, padding: "1rem", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, background: "var(--blue)", borderRadius: "50%", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Question {i + 1}</span>
            <button onClick={() => remove(i)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          <input className="input" value={q.text} onChange={e => update(i, "text", e.target.value)} placeholder="Question prompt…" style={{ marginBottom: 8 }} />
          <textarea className="input" value={q.starterCode} onChange={e => update(i, "starterCode", e.target.value)} rows={4} placeholder="Starter Java code…" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: "vertical", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" value={q.hints} onChange={e => update(i, "hints", e.target.value)} placeholder="Hints / expected approach…" style={{ flex: 1 }} />
            <input className="input" type="number" value={q.points} onChange={e => update(i, "points", parseInt(e.target.value) || 10)} style={{ width: 80 }} placeholder="Pts" />
          </div>
        </div>
      ))}
      <button onClick={add} style={{ width: "100%", padding: "9px", border: "0.5px dashed var(--blue)", borderRadius: 9, background: "transparent", color: "var(--blue)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: "1rem" }}>
        + Add Question
      </button>
    </div>
  );
}

export default function Tests() {
  const { currentUser } = useAuth();
  const [tests, setTests] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", duration: 45, passScore: 60, instructions: "", questions: [{ text: "", starterCode: "public class Solution {\n    // Your code here\n}", hints: "", points: 10 }] });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tests"), snap => {
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function saveTest() {
    if (!form.title.trim()) { alert("Enter a test title"); return; }
    if (!form.questions.some(q => q.text.trim())) { alert("Add at least one question"); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, "tests"), {
        ...form,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName,
        createdAt: serverTimestamp(),
        isActive: true,
      });
      setOpen(false);
      setForm({ title: "", duration: 45, passScore: 60, instructions: "", questions: [{ text: "", starterCode: "public class Solution {\n    // Your code here\n}", hints: "", points: 10 }] });
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  }

  async function deleteTest(id) {
    if (!window.confirm("Delete this test? This cannot be undone.")) return;
    await deleteDoc(doc(db, "tests", id));
  }

  function copyLink(id) {
    const url = `${window.location.origin}/take/${id}`;
    navigator.clipboard.writeText(url).then(() => alert("Link copied!\n\n" + url)).catch(() => alert("Link: " + url));
  }

  const filtered = tests.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Tests</h1>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Create Test</button>
      </div>

      <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests…" style={{ maxWidth: 320, marginBottom: "1rem" }} />

      {filtered.length === 0 && (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray)", fontSize: 14 }}>
          No tests yet. Create your first one →
        </div>
      )}

      {filtered.map(t => (
        <div key={t.id} className="card" style={{ padding: "1rem 1.25rem", marginBottom: 10, display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 44, height: 44, background: "var(--blue-light)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>☕</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>
              {t.questions?.length || 0} questions · {t.duration} min · Pass: {t.passScore}%
              {t.createdByName && <> · by {t.createdByName}</>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => copyLink(t.id)}>🔗 Copy Link</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteTest(t.id)}>Delete</button>
          </div>
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Create New Test</h2>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--gray)" }}>×</button>
        </div>

        <div className="field">
          <label className="input-label">Test Title</label>
          <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Java Backend Assessment – Round 1" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label className="input-label">Duration (minutes)</label>
            <input className="input" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 45 }))} />
          </div>
          <div>
            <label className="input-label">Pass Score (%)</label>
            <input className="input" type="number" value={form.passScore} onChange={e => setForm(f => ({ ...f, passScore: parseInt(e.target.value) || 60 }))} />
          </div>
        </div>

        <div className="field">
          <label className="input-label">Instructions (optional)</label>
          <textarea className="input" rows={2} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Any special instructions for candidates…" style={{ resize: "vertical" }} />
        </div>

        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Questions</div>
        <QuestionBuilder questions={form.questions} onChange={qs => setForm(f => ({ ...f, questions: qs }))} />

        <button className="btn btn-primary btn-full" onClick={saveTest} disabled={saving}>
          {saving ? "Saving…" : "💾 Save Test"}
        </button>
      </Modal>
    </div>
  );
}

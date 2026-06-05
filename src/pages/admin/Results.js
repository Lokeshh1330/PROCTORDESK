// src/pages/admin/Results.js
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { format } from "date-fns";

export default function Results() {
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "results"), orderBy("submittedAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = results.filter(r =>
    r.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
    r.testTitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Results</h1>
        <span style={{ fontSize: 13, color: "var(--gray)" }}>{results.length} submissions</span>
      </div>

      <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or test…" style={{ maxWidth: 320, marginBottom: "1.25rem" }} />

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
              {["Candidate", "Test", "Submitted", "Score", "Violations", "Time Used", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "var(--gray)" }}>No results yet</td></tr>
            )}
            {filtered.map(r => {
              const passed = r.score >= (r.passScore || 60);
              const submittedDate = r.submittedAt ? (r.submittedAt.toDate ? format(r.submittedAt.toDate(), "dd MMM yyyy, HH:mm") : r.submittedAt) : "—";
              const used = r.timeUsed ? `${Math.floor(r.timeUsed / 60)}m ${r.timeUsed % 60}s` : "—";
              return (
                <tr key={r.id} style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600 }}>{r.candidateName}</div>
                    <div style={{ fontSize: 11, color: "var(--gray)" }}>{r.candidateEmail}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>{r.testTitle}</td>
                  <td style={{ padding: "12px 14px", color: "var(--gray)" }}>{submittedDate}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className={`badge ${passed ? "badge-green" : "badge-red"}`}>{r.score}%</span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    {r.violations > 0
                      ? <span className="badge badge-red">{r.violations}</span>
                      : <span style={{ color: "var(--gray)" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--gray)" }}>{used}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className={`badge ${passed ? "badge-green" : "badge-red"}`}>
                      {passed ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

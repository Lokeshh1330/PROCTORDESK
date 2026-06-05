// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { format } from "date-fns";

const TYPE_MAP = {
  fullscreen: { label: "Fullscreen Exit", cls: "badge-red" },
  tab: { label: "Tab Switch", cls: "badge-red" },
  paste: { label: "Paste Attempt", cls: "badge-amber" },
  blur: { label: "Window Blur", cls: "badge-amber" },
  devtools: { label: "DevTools", cls: "badge-red" },
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "1rem 1.25rem" }}>
      <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ tests: 0, submissions: 0, active: 0, violations: 0 });
  const [violations, setViolations] = useState([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load counts
  useEffect(() => {
    async function loadStats() {
      const testsSnap = await getDocs(collection(db, "tests"));
      const resultsSnap = await getDocs(collection(db, "results"));
      const violSnap = await getDocs(collection(db, "violations"));
      setStats({
        tests: testsSnap.size,
        submissions: resultsSnap.size,
        active: 0,
        violations: violSnap.size,
      });
    }
    loadStats();
  }, []);

  // Live violation feed
  useEffect(() => {
    const q = query(collection(db, "violations"), orderBy("timestamp", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setViolations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(s => ({ ...s, violations: snap.size }));
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 2 }}>Live overview of all assessments</p>
        </div>
        <div style={{ fontSize: 12, color: "var(--gray)", background: "var(--gray-light)", padding: "5px 14px", borderRadius: 20, fontVariantNumeric: "tabular-nums" }}>
          🕐 {format(time, "HH:mm:ss")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard label="Total Tests" value={stats.tests} sub="Created" />
        <StatCard label="Submissions" value={stats.submissions} sub="All time" />
        <StatCard label="Active Now" value={stats.active} sub="Online" color="var(--green)" />
        <StatCard label="Violations" value={stats.violations} sub="Flagged" color={stats.violations > 0 ? "var(--red)" : undefined} />
      </div>

      {/* Live Feed */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
        <span className="live-dot" />
        <span style={{ fontSize: 15, fontWeight: 700 }}>Live Violation Feed</span>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 1rem", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span className="live-dot" />
          Real-time alerts
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--gray)" }}>{violations.length} events</span>
        </div>

        {violations.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--gray)", fontSize: 13 }}>
            ✅ No violations yet. Feed updates in real time.
          </div>
        ) : (
          violations.map(v => {
            const info = TYPE_MAP[v.type] || { label: v.type, cls: "badge-blue" };
            return (
              <div key={v.id} style={{ padding: "12px 1rem", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                {v.snapshotUrl ? (
                  <img src={v.snapshotUrl} alt="snapshot" style={{ width: 44, height: 34, objectFit: "cover", borderRadius: 5, border: "0.5px solid var(--border)" }} />
                ) : (
                  <div style={{ width: 44, height: 34, background: "#1e1e2e", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📷</div>
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{v.candidateName || "Candidate"}</div>
                  <div style={{ fontSize: 11, color: "var(--gray)" }}>{v.testTitle || "Assessment"}</div>
                </div>
                <span className={`badge ${info.cls}`}>{info.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--gray)", whiteSpace: "nowrap" }}>
                  {v.timestamp ? format(v.timestamp.toDate(), "HH:mm:ss") : ""}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

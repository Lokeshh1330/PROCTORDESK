// src/pages/admin/Violations.js
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { format } from "date-fns";

const TYPE_MAP = {
  fullscreen: { label: "Fullscreen Exit", cls: "badge-red", icon: "⛶" },
  tab: { label: "Tab Switch", cls: "badge-red", icon: "🔄" },
  paste: { label: "Paste Attempt", cls: "badge-amber", icon: "📋" },
  blur: { label: "Window Blur", cls: "badge-amber", icon: "👁" },
  devtools: { label: "DevTools Open", cls: "badge-red", icon: "🔧" },
  rightclick: { label: "Right Click", cls: "badge-amber", icon: "🖱" },
};

export default function Violations() {
  const [violations, setViolations] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "violations"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, snap => {
      setViolations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const types = ["all", ...Object.keys(TYPE_MAP)];
  const filtered = filter === "all" ? violations : violations.filter(v => v.type === filter);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="live-dot" /> Violation Log
          </h1>
          <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 2 }}>Real-time anti-cheat events</p>
        </div>
        <span style={{ fontSize: 13, color: "var(--gray)" }}>{violations.length} total events</span>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: "5px 14px", borderRadius: 20, border: "0.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", borderColor: filter === t ? "var(--blue)" : "var(--border)", background: filter === t ? "var(--blue-light)" : "transparent", color: filter === t ? "var(--blue)" : "var(--gray)" }}>
            {t === "all" ? "All" : TYPE_MAP[t]?.label || t}
            {t !== "all" && <span style={{ marginLeft: 5, background: "rgba(0,0,0,.08)", borderRadius: 10, padding: "0 5px" }}>{violations.filter(v => v.type === t).length}</span>}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray)", fontSize: 14 }}>✅ No violations recorded</div>
        ) : (
          filtered.map(v => {
            const info = TYPE_MAP[v.type] || { label: v.type, cls: "badge-blue", icon: "⚡" };
            const ts = v.timestamp ? format(v.timestamp.toDate(), "dd MMM, HH:mm:ss") : "";
            return (
              <div key={v.id} style={{ padding: "12px 1rem", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                {v.snapshotUrl ? (
                  <img src={v.snapshotUrl} alt="" style={{ width: 52, height: 40, objectFit: "cover", borderRadius: 6, border: "0.5px solid var(--border)" }} />
                ) : (
                  <div style={{ width: 52, height: 40, background: "#1e1e2e", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {info.icon}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{v.candidateName || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: "var(--gray)" }}>{v.testTitle} · {v.candidateEmail}</div>
                </div>
                <span className={`badge ${info.cls}`}>{info.label}</span>
                <span style={{ fontSize: 11, color: "var(--gray)", whiteSpace: "nowrap" }}>{ts}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

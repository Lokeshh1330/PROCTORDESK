// src/components/AdminLayout.js
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/tests", label: "Tests", icon: "📋" },
  { to: "/admin/results", label: "Results", icon: "📈" },
  { to: "/admin/violations", label: "Violations", icon: "⚠️" },
];

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/auth");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Nav */}
      <header style={{ background: "var(--card)", borderBottom: "0.5px solid var(--border)", height: 56, display: "flex", alignItems: "center", padding: "0 1.5rem", gap: "1rem", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "1.5rem" }}>
          <div style={{ width: 28, height: 28, background: "var(--blue)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>P</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.4px" }}>ProctorDesk</span>
        </div>

        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} style={({ isActive }) => ({ padding: "0 12px", height: 56, display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: isActive ? "var(--blue)" : "var(--gray)", borderBottom: isActive ? "2px solid var(--blue)" : "2px solid transparent", textDecoration: "none", transition: "color .15s", gap: 6 })}>
            <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
          </NavLink>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--gray)" }}>{currentUser?.displayName}</span>
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--blue)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {currentUser?.displayName?.[0]?.toUpperCase() || "A"}
            </button>
            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: 42, background: "var(--card)", border: "0.5px solid var(--border)", borderRadius: 10, width: 160, boxShadow: "var(--shadow-lg)", zIndex: 200 }}>
                <button onClick={handleLogout} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", textAlign: "left", fontSize: 13, color: "var(--red)", cursor: "pointer", borderRadius: 10 }}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: "1.75rem 2rem", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

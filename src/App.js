// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./styles/global.css";

import AuthPage from "./pages/AuthPage";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Tests from "./pages/admin/Tests";
import Results from "./pages/admin/Results";
import Violations from "./pages/admin/Violations";
import CandidateTests from "./pages/CandidateTests";
import TakeExam from "./pages/TakeExam";

function PrivateRoute({ children, requiredRole }) {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/auth" replace />;
  if (requiredRole && userRole !== requiredRole)
    return <Navigate to={userRole === "admin" ? "/admin" : "/tests"} replace />;
  return children;
}

function RootRedirect() {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/auth" replace />;
  return <Navigate to={userRole === "admin" ? "/admin" : "/tests"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="tests" element={<Tests />} />
        <Route path="results" element={<Results />} />
        <Route path="violations" element={<Violations />} />
      </Route>

      {/* Candidate */}
      <Route path="/tests" element={<PrivateRoute requiredRole="candidate"><CandidateTests /></PrivateRoute>} />
      <Route path="/take/:testId" element={<PrivateRoute requiredRole="candidate"><TakeExam /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

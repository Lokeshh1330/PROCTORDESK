// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name, role) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    try {
      await setDoc(doc(db, "users", cred.user.uid), {
        name, email, role,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Firestore write failed:", e.message);
    }
    setUserRole(role);
    return cred;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserRole(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          try {
            const snap = await getDoc(doc(db, "users", user.uid));
            setUserRole(snap.exists() ? snap.data().role : "candidate");
          } catch (e) {
            setUserRole("candidate");
          }
        } else {
          setUserRole(null);
        }
        setCurrentUser(user);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, signup, login, logout, loading }}>
      {!loading ? children : (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#6b7280" }}>
          Loading…
        </div>
      )}
    </AuthContext.Provider>
  );
}

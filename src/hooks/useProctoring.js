// src/hooks/useProctoring.js
import { useEffect, useRef, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

export function useProctoring({ enabled, candidateName, candidateEmail, testId, testTitle, onViolation }) {
  const webcamRef = useRef(null);
  const streamRef = useRef(null);
  const activeRef = useRef(false);
  const canvasRef = useRef(document.createElement("canvas"));

  // Start webcam
  const startWebcam = useCallback(async (videoEl) => {
    webcamRef.current = videoEl;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      streamRef.current = stream;
      if (videoEl) { videoEl.srcObject = stream; }
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture webcam snapshot → upload to Firebase Storage
  const captureSnapshot = useCallback(async () => {
    const video = webcamRef.current;
    if (!video || !streamRef.current) return null;
    const canvas = canvasRef.current;
    canvas.width = 320; canvas.height = 240;
    canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    try {
      const storageRef = ref(storage, `snapshots/${testId}/${candidateEmail}_${Date.now()}.jpg`);
      await uploadString(storageRef, dataUrl, "data_url");
      return await getDownloadURL(storageRef);
    } catch {
      return null; // If storage not configured, ignore
    }
  }, [testId, candidateEmail]);

  // Log violation to Firestore + notify parent
  const logViolation = useCallback(async (type) => {
    if (!activeRef.current) return;
    const snapshotUrl = await captureSnapshot();
    const data = {
      type, candidateName, candidateEmail, testId, testTitle,
      snapshotUrl: snapshotUrl || null,
      timestamp: serverTimestamp(),
    };
    await addDoc(collection(db, "violations"), data).catch(() => {});
    onViolation?.(type);
  }, [candidateName, candidateEmail, testId, testTitle, captureSnapshot, onViolation]);

  // All event listeners
  useEffect(() => {
    if (!enabled) return;
    activeRef.current = true;

    const onVisibility = () => { if (document.hidden) logViolation("tab"); };
    const onBlur = () => logViolation("blur");
    const onFullscreen = () => { if (!document.fullscreenElement) logViolation("fullscreen"); };
    const onPaste = (e) => { e.preventDefault(); logViolation("paste"); };
    const onCopy = (e) => { e.preventDefault(); logViolation("paste"); };
    const onCtx = (e) => { e.preventDefault(); logViolation("rightclick"); };
    const onKey = (e) => {
      const blocked = ["F12", "F11", "F5"];
      const ctrlBlocked = ["c", "v", "x", "u", "i", "j", "s"];
      if (blocked.includes(e.key)) { e.preventDefault(); if (e.key === "F12") logViolation("devtools"); }
      if (e.ctrlKey && ctrlBlocked.includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (["c", "v", "x"].includes(e.key.toLowerCase())) logViolation("paste");
      }
      // Prevent Alt+Tab, Alt+F4 etc
      if (e.altKey) e.preventDefault();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("keydown", onKey);

    return () => {
      activeRef.current = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown", onKey);
    };
  }, [enabled, logViolation]);

  // Fullscreen helpers
  const requestFullscreen = () => document.documentElement.requestFullscreen().catch(() => {});
  const exitFullscreen = () => document.fullscreenElement && document.exitFullscreen().catch(() => {});
  const isFullscreen = () => !!document.fullscreenElement;

  return { startWebcam, stopWebcam, logViolation, requestFullscreen, exitFullscreen, isFullscreen };
}

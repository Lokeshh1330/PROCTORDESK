# ProctorDesk — Secure Assessment Platform

A full-stack proctored exam platform built with React + Firebase.

---

## 🚀 Deploy to Vercel in 5 Steps

### Step 1 — Create your .env file
Copy `.env.example` to `.env` and fill in your Firebase values:
```
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=yourproject
REACT_APP_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123...
```

### Step 2 — Get Firebase config
1. Go to https://console.firebase.google.com
2. Your Project → Project Settings → General → Your Apps → Web App
3. Copy each value into your .env file

### Step 3 — Enable Firebase services
- **Authentication** → Sign-in method → Enable Email/Password
- **Firestore Database** → Create database → Production mode
- **Storage** → Get started (for webcam snapshots)

### Step 4 — Firestore Rules
Go to Firestore → Rules tab → paste this and click Publish:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 5 — Deploy to Vercel
1. Push to GitHub (`.env` is in `.gitignore` so it won't be pushed)
2. Go to https://vercel.com → New Project → Import your GitHub repo
3. In Vercel project settings → **Environment Variables** → add all 6 REACT_APP_ variables
4. Click Deploy!

OR deploy via terminal:
```bash
npm install -g vercel
vercel
```

---

## Usage

### Admin
1. Sign up with role Admin
2. Go to Tests → Create Test → add Java questions
3. Copy test link → share with candidates
4. Watch Dashboard for live violations

### Candidate
1. Sign up with role Candidate
2. See available tests
3. Click Start → fullscreen activates → webcam turns on
4. Answer coding questions → Submit

---

## Features
- ✅ Email/password auth with roles (Admin / Candidate)
- ✅ Fullscreen enforcement
- ✅ Tab switch detection
- ✅ Copy/paste & keyboard shortcut blocking
- ✅ Webcam monitoring with snapshots on violation
- ✅ Live violation feed on admin dashboard (Firestore realtime)
- ✅ Monaco code editor (VS Code quality) for Java
- ✅ Auto-submit on timer expiry
- ✅ Results with score, violations, pass/fail

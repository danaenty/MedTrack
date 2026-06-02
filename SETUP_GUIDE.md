# MedTrack — Setup Guide
> Built by Kabiru Bayu Bello · FUHSA Azare

---

## What you need before starting
- A Google account
- Node.js installed → https://nodejs.org (download the LTS version)
- A free GitHub account → https://github.com
- VS Code or any text editor

---

## How this works (big picture)

```
Your computer
├── .env              ← real Firebase keys, stays here forever, never pushed to GitHub
├── src/              ← source code, pushed to main branch (safe, no keys in it)
└── dist/             ← built output, pushed to gh-pages branch by gh-pages package
```

When you run `npm run deploy`, the app is built using your local `.env` file
(keys get baked into the compiled output), then only the compiled output is
pushed to GitHub. Nobody ever sees your raw keys.

---

## STEP 1 — Set your admin email

Open `src/admin.js` and replace the placeholder with your actual Google email:

```js
export const ADMIN_EMAIL = "kabiru@gmail.com"; // ← your real Gmail
```

This is the only account that can access the Admin panel to add, edit, or delete topics.
Everyone else who logs in can only view and track topics.

---

## STEP 2 — Set up Firebase (10 minutes)

### 2a. Create a Firebase project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it `medtrack`
3. Disable Google Analytics → click **Create project**

### 2b. Enable Google Authentication
1. Left sidebar → **Build → Authentication → Get started**
2. Click **Google** under Sign-in providers
3. Toggle **Enabled** → set a support email → **Save**

### 2c. Create Firestore Database
1. Left sidebar → **Build → Firestore Database → Create database**
2. Choose **"Start in production mode"** → Next
3. Pick a location close to Nigeria (e.g. `europe-west1`) → **Enable**

### 2d. Set Firestore security rules

In Firestore → **Rules** tab, replace everything with this and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Topics: only admin can write, anyone logged in can read
    match /courses/{courseId}/topics/{topicId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.token.email == "lamineyamalefm@gmail.com";
    }

    // Progress: each user can only read/write their own
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

> ⚠️ Replace `YOUR_EMAIL@gmail.com` with your actual Google email in the rules above.

### 2e. Get your Firebase config
1. Gear icon (top left) → **Project settings**
2. Scroll to **"Your apps"** → click **"</>"** web icon
3. Name it `medtrack-web` → **Register app**
4. Copy the config values — you'll need them in the next step.

---

## STEP 3 — Set up environment variables

### 3a. Create your .env file
1. Find the file called `.env.example` in the project
2. Make a copy of it and rename the copy to `.env`
3. Fill in your actual Firebase values:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=medtrack-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medtrack-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=medtrack-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> ⚠️ `.env` is in `.gitignore` — it will NEVER be pushed to GitHub.

---

## STEP 4 — Run locally to test

```bash
npm install
npm run dev
```

Open http://localhost:5173/medtrack/ in your browser.

- Log in with your Google account
- You should see an **Admin** link in the header (only visible to your email)
- Go to Admin → add a topic → confirm it appears on the Dashboard
- Log out and log in with a different Google account → Admin link should be gone

---

## STEP 5 — Adding topics (your main workflow)

1. Log in with your admin Google account
2. Click **Admin** in the header
3. Select a course using the course buttons
4. Type the topic title
5. Paste the Google Drive slide URL (optional — you can add it later)
6. Click **Add Topic**

The topic instantly appears for all logged-in users. No redeployment needed.

### How to get a Google Drive preview URL
1. Upload your slides to Google Drive
2. Right-click → **Share** → set to **"Anyone with the link"**
3. Copy the link:
   `https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE3/view`
4. Change `/view` to `/preview`:
   `https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE3/preview`
5. Paste that as the slide URL in the form

---

## STEP 6 — Add your social media links

Open `src/pages/ContactPage.jsx`. At the top, find `SOCIAL_LINKS` and replace each `href`:

```js
{ name: "Facebook",  href: "https://facebook.com/YOUR_USERNAME", ... },
{ name: "Instagram", href: "https://instagram.com/YOUR_USERNAME", ... },
{ name: "Twitter / X", href: "https://twitter.com/YOUR_USERNAME", ... },
{ name: "Telegram",  href: "https://t.me/YOUR_USERNAME", ... },
```

Set `href: ""` to hide any platform you don't use.

---

## STEP 7 — Create your GitHub repository

1. Go to https://github.com → **New repository**
2. Name it exactly `medtrack`
3. Set to **Public**
4. Do NOT tick README or any other option
5. Click **Create repository**

---

## STEP 8 — Push your source code

Run these in your project terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/medtrack.git
git push -u origin main
```

> ✅ After pushing, check GitHub — the `.env` file should NOT be there.

---

## STEP 9 — Enable GitHub Pages

1. Go to your GitHub repo → **Settings → Pages**
2. Under **Source**, select **"Deploy from a branch"**
3. Under **Branch**, select `gh-pages` → `/ (root)` → **Save**

The `gh-pages` branch doesn't exist yet — the next step creates it.

---

## STEP 10 — Deploy

```bash
npm run deploy
```

This builds the app (using your `.env`) and pushes only the compiled output to the `gh-pages` branch. Your live site will be at:

```
https://YOUR_GITHUB_USERNAME.github.io/medtrack/
```

Wait 1–2 minutes after the first deploy for GitHub Pages to activate.

> If your repo name is not `medtrack`, open `vite.config.js` and change
> `base: "/medtrack/"` to match your actual repo name.

---

## STEP 11 — Whitelist your URL in Firebase

1. Firebase Console → **Authentication → Settings → Authorized domains**
2. Click **Add domain**
3. Add: `YOUR_GITHUB_USERNAME.github.io`
4. Click **Add**

---

## Redeploying after changes

Topics are managed through the Admin panel — no redeployment needed for those.

If you change something in the code (social links, about page, etc.):

```bash
git add .
git commit -m "Update contact links"
git push
npm run deploy
```

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Blank page on GitHub Pages | Check `base` in `vite.config.js` matches your repo name exactly |
| Admin link not showing | Check `ADMIN_EMAIL` in `src/admin.js` matches your Google account email exactly |
| Topics not saving | Check Firestore rules — make sure your email is in the write rule |
| Google login fails | Add `YOUR_GITHUB_USERNAME.github.io` to Firebase Authorized Domains |
| Works locally but not live | Run `npm run deploy` again after any `.env` or code changes |
| Slides not showing | URL must end in `/preview`, file must be shared as "Anyone with the link" |

---

Good luck with your 2nd MBBS exams! 🩺

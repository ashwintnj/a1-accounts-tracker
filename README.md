# A1 Shop Accounts

A Progressive Web App (PWA) for daily shop accounts calculation with real-time sync across devices.

## Features

- **8-Step Daily Entry Flow** with hard tally validation (X + D = C)
- **Multi-device sync** via Firebase Firestore
- **PWA** — installable on mobile home screen
- **History** view with edit capability (with warning for old records)
- **Monthly Summary** with totals and breakdown
- **Offline support** (service worker caching)
- **₹ INR formatting** throughout

## Tech Stack

- React 18 + Vite
- Tailwind CSS (mobile-first)
- Firebase Auth + Firestore
- vite-plugin-pwa

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Email/Password provider
4. Enable **Firestore Database** (start in test mode for dev)
5. Go to Project Settings → Your Apps → Add Web App
6. Copy the config values

### 3. Create `.env` file

Copy `.env.example` to `.env` and fill in your Firebase values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 5. Build for production

```bash
npm run build
```

Output is in `dist/` folder.

## Deploy to Firebase Hosting (Free)

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize hosting

```bash
firebase init hosting
```

- Select your Firebase project
- Public directory: `dist`
- Single-page app: **Yes**
- Overwrite index.html: **No**

### 3. Build and deploy

```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at `https://your-project.web.app`

## Firestore Security Rules (Recommended)

For production, update your Firestore rules to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dailyRecords/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Calculation Flow

1. **Bank Accounts**: X = Opening Total − Closing Total
2. **Debits**: C = A (UPI Sent) + B (Wallet Adds)
3. **Money Received**: D = Sum of entries + Old AEPS
4. **Tally Check**: X + D = C (hard block if mismatch)
5. **Recharges**: E = GR + EG wallet recharges
6. **Extra Received**: F = GPay Business + AEPS + Money Before Screenshot
7. **D_Total**: D + F − Old AEPS
8. **Final**: G − D_Total where G = A + E
   - Positive → Take cash OUT from shop to yellow box
   - Negative → Pay cash INTO shop from yellow box

## License

Personal use only.

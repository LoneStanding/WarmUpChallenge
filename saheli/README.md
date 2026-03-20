# Saheli — Rural Triage Bridge

A clinical decision support web application for community health workers (CHWs) in low-resource settings. Saheli uses AI (Google Gemini) for clinical extraction, features strict offline-first rule-based fallback logic, and operates entirely on the device as a PWA.

## Features
- 🎙️ **Voice Input**: Describe symptoms directly using the Web Speech API.
- 🤖 **AI Parsing**: Extracts clinical data, scores severity, and provides care steps natively into structured JSON using Google Gemini 1.5 Flash.
- 📴 **Offline First**: Bundled fallback triage engine based on WHO IMCI kicks in automatically when connectivity drops. Entire app shell and cases are cached locally (IndexedDB + Workbox).
- 🏥 **Automated Referral Letters**: Generates printable/shareable PDFs locally without a server.
- 📱 **Mobile UI**: High contrast, readable designs, `< 200KB` initial core bundle size.

## Setup Instructions

1. Ensure you have Node.js installed.
2. In the `saheli` directory, install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Set your Google Gemini API Key in the environment (e.g., inside `.env.local`):
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```
   *(For production, this should be routed through a backend proxy, but for this client-only MVP, it uses direct REST/SDK).*
4. Start the development server (which simulates PWA):
   ```bash
   npm run dev
   ```

## Creating the PWA / Production Build

To test the actual service worker and offline mode, you must build the app:
```bash
npm run build
npm run preview
```
1. Open the preview URL in your browser.
2. Open DevTools > Application tab to verify the Service Worker is active.
3. Open DevTools > Network tab, check "Offline", and try running a consultation!

## How to add a new language
UI Language translations are stubbed in `src/app.tsx`. To fully implement:
1. Create a `src/i18n` directory.
2. Add JSON dictionaries for your languages (e.g., `en.json`, `sw.json`).
3. Use a lightweight translation tool like `preact-i18n` or build a custom hook `useTranslation()` that looks up the active language from the `App` component's state.
4. Pass the selected language code from `navigator.language` to `voiceManager.start()` in `src/screens/Home.tsx` to automatically listen in the local dialect.

## How to update clinical protocols
- **Online (Gemini)**: Edit the `SYSTEM_PROMPT` inside `src/lib/ai.ts`. You can attach WHO primary care guidelines or custom logic.
- **Offline (Fallback)**: Edit the exact decision tree and rule mappings inside `src/lib/triage-fallback.ts`. This file runs when the `navigator.onLine` is false or the AI request fails.

## Deployment Guide
This is a standard static PWA and can be deployed anywhere that serves static files. 
Since the prompt requested "Google Services where possible", **Firebase Hosting** is highly recommended:
1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase init hosting` (Choose the `dist` folder as your public directory)
4. `firebase deploy`

Alternatively, for Netlify/Vercel/Cloudflare Pages, simply point the build command to `npm run build` and output directory to `dist`.

# Saheli — Tech Stack & Project Architecture

## Project Overview
**Saheli** (meaning "friend" or "companion") is a clinical decision support web application designed specifically for rural Community Health Workers (CHWs) working in low-resource environments. The application serves as a bridge between frontline workers and complex medical protocols by translating unstructured symptoms (via voice or text) into actionable triage steps.

### Core Challenges & Constraints Met
1. **Zero Connectivity (`Offline-First`)**: Addressed by making the app a Progressive Web App (PWA) with total local caching and a fallback rule-based triage engine that operates without any internet or APIs.
2. **Mobile First (`<480px`)**: Designed with large 48px tap targets, distinct colors, and a clean, high-contrast, scroll-optimized interface.
3. **Bandwidth Limitations**: Achieved an ultra-lightweight initial bundle (`< 200KB` compressed) by carefully selecting minimalistic libraries.

---

## The Technology Stack

### 1. Frontend Framework: Preact + Vite
- **Why Preact**: At just `3kB`, Preact offers the same declarative component model as React but with drastically lower overhead. This is the primary reason the app remains so lightweight and fast on low-end Android devices.
- **Why Vite**: Vite natively supports instant server start and lightning-fast HMR, but critically, it has first-party support for robust PWA bundling via `vite-plugin-pwa`.

### 2. Styling: Tailwind CSS
- **Why Tailwind**: Allows designing highly custom, responsive, and complex UI components entirely within the TSX files without needing external stylesheets. During the build process, Tailwind tree-shakes all unused CSS, generating a minimal stylesheet that loads instantly.

### 3. Local Storage: Dexie.js (IndexedDB)
- **Why Dexie**: For complete offline privacy, no patient data leaves the device. Using the browser's native IndexedDB API directly is very verbose, so `Dexie.js` acts as a clean wrapper to query, save, and filter cases asynchronously. It handles our `userId` support and patient history tracking securely on the hardware.

### 4. AI Engine: Google Gemini API
- **Why Gemini (`gemini-2.5-flash`)**: Used for the primary online clinical extraction process. It takes the patient's transcript and/or an uploaded image, parses the data intelligently based on the WHO IMCI constraints injected via its `SYSTEM_PROMPT`, and strictly outputs structured JSON. This eliminates hallucinations during the translation layer.
- **Offline Fallback**: If the Gemini API key is missing or the CHW has no signal, the app automatically switches to `runOfflineTriage()`, a bundled decision tree algorithm that extracts basic keywords to provide a safe, conservative local triage.

### 5. Native Integration & APIs
- **Voice Input (`Web Speech API`)**: Built directly into Chrome/Android, this enables native speech-to-text without relying on heavy frontend STT libraries or network connections if the local language model is cached on the phone.
- **PDF Generation (`jsPDF`)**: Generates structured referral letters dynamically. Because it runs purely on the client-side using JavaScript, a CHW can create and download a Medical Referral PDF in the middle of a village with no internet.

---

## Project Structure & Data Flow

### The Screens
1. **`Login.tsx`**: A purely local login wall allowing multiple CHWs to share the same tablet. It separates their patients by `userId` and provides an encrypted field to dynamically configure the Gemini API Key.
2. **`Home.tsx`**: The main consultation dashboard. Supports live Voice Recording, manual text input, and hardware Image Uploads (converted locally to `Base64`).
3. **`Processing.tsx`**: An intermediate loading screen displaying what the AI is analyzing.
4. **`DecisionOutput.tsx`**: The critical summary screen. Fits on a single mobile screen and highlights the severity badge, extracts symptoms, prominently warns of "Danger Signs", and formats clear, numbered **Action Steps**.
5. **`ReferralLetter.tsx`**: Formats the case data into an urgently styled view with options to copy the text to clipboard, share instantly to WhatsApp, or export a PDF.
6. **`CaseHistory.tsx`**: Queries the `Dexie.js` database to show past triage history filtered by severity or outcome.

### Core Logic Libraries
- **`src/lib/ai.ts`**: The hub for configuring the Gemini SDK payload and system instructions.
- **`src/lib/db.ts`**: defines the `Consultation` types and initializes the database tables and schemas.
- **`src/lib/voice.ts`**: Wraps the flaky `window.SpeechRecognition` API into an easy-to-use Class that automatically restarts listeners if they unexpectedly close.
- **`src/lib/triage-fallback.ts`**: The fail-safe offline regex parser for emergency local triage.

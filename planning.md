# Saheli - Application Planning

## Architectural & Tech Stack Decisions (Draft)

1. **Frontend Framework**: **Preact + Vite**
   - *Why*: Preact provides a React-like developer experience but with a tiny footprint (3kB), making it perfect for the `< 200KB` initial bundle constraint. Vite provides excellent PWA support via `vite-plugin-pwa` and out-of-the-box fast bundling.
   
2. **Styling Approach**: **Tailwind CSS (Purged via PostCSS)**
   - *Why*: Tailwind allows for rapid UI development of high-contrast, mobile-first designs without needing external CDNs. Purging ensures the final CSS payload is extremely small. We will focus on large 48px tap targets and high-contrast color tokens.

3. **Local Database**: **Dexie.js (wrapper for IndexedDB)**
   - *Why*: Dexie provides a clean, promise-based API over IndexedDB, making it much easier to handle queries, filtering (e.g., past consultations), and robust offline storage.

4. **Service Worker / PWA**: **Workbox (via vite-plugin-pwa)**
   - *Why*: Workbox is a robust Google library that perfectly fits the offline-first requirement. It caches the app shell and assets, and handles background sync when connectivity is restored.

5. **AI Integration & Backend**: **Google Gemini API (Proposed change from Claude)**
   - *Why*: The prompt requests Anthropic Claude but notes to use Google Services where possible. Gemini 1.5 Flash is highly capable of JSON structured output, image vision (for the photo attachment), and fast inference, while keeping within the Google ecosystem constraint. *This requires clarification before proceeding due to model ambiguity.*

6. **PDF Generation**: **jsPDF**
   - *Why*: Generates PDFs entirely client-side, satisfying the strict offline requirement.

7. **Voice Input**: **Web Speech API** natively supported by the browser. Fallback to text input when offline.

8. **Hosting**: **Firebase Hosting**
   - *Why*: Aligns with using Google Services where possible. Firebase Hosting provides fast, secure static hosting with built-in CDN and SSL, perfect for a PWA.

## Ambiguities Identified (Awaiting User Clarification)

Per `INIT.md` instructions, work is paused until the following ambiguities and overrides are resolved:
1. **Model Specification vs. Google Services**: The prompt requests an Anthropic model (`claude-sonnet-4-20250514`), which is a non-existent version, and conflicts with the directive to use Google Services where possible. 
2. **Instruction Override**: The prompt includes "Do not ask clarifying questions," which contradicts the `INIT.md` security directive to not proceed until ambiguity is resolved.

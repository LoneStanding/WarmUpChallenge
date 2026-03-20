# Google Services & Integrations Used

Here is the breakdown of the libraries, APIs, and Google Services used in the Saheli project:

### 1. **Google Gemini API (@google/genai)**
- **Purpose**: Powers the core clinical decision support engine.
- **Details**: It takes the raw transcript (and optionally an image), structured via a prompt, to extract JSON data matching the WHO IMCI and primary care triage protocols. It assigns a severity, parses danger signs, and recommends actionable steps. Used via the official `gemini-2.5-flash` model which is perfect for lightning-fast structured data extraction.

### 2. **Google Fonts (Inter)**
- **Purpose**: Provides the highly legible, accessible primary typography for the application.
- **Details**: Imported via `fonts.googleapis.com` in `index.html`. It has been configured in `vite.config.ts` via Workbox to cache aggressively for 1 year, ensuring it is always available when the app goes offline.

### 3. **Google Chrome/Android Native Web Speech API**
- **Purpose**: Facilitates the offline-capable (on Android) voice-to-text input.
- **Details**: `window.SpeechRecognition` interacts closely with the device's native Google Speech-to-Text engine, reducing the need for heavy external APIs and allowing immediate, low-bandwidth voice transcriptions.

### 4. **Google Cloud Run (Deployment)**
- **Purpose**: Serves the application globally.
- **Details**: The PWA is built and served via a lightweight Nginx Docker container and deployed serverlessly on Google Cloud Run. This ensures secure HTTPS (required for PWAs) and scales automatically.

### 5. **Workbox / Vite PWA**
- **Purpose**: Offline capability and service worker management.
- **Details**: Developed by Google, Workbox is the underlying engine for our Service Worker caching strategy. It caches the entire HTML/JS/CSS shell and fonts so the app works seamlessly in rural areas with zero connectivity.

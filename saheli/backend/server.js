const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Setup Firestore
let firestore = null;
try {
  firestore = new Firestore();
} catch (e) {
  console.log("Firestore missing configuration...", e.message);
}

// In-memory fallback if Firestore fails (local testing)
const memoryUsers = new Map();

app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    
    // Sanitize to create ID
    const userId = username.toLowerCase().replace(/\s+/g, '-');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Try Firestore first
    try {
      if (firestore) {
        const docRef = firestore.collection('users').doc(userId);
        const doc = await docRef.get();
        if (doc.exists) return res.status(400).json({ error: 'User already exists' });
        
        await docRef.set({ username, password: hashedPassword, createdAt: new Date().toISOString() });
        return res.json({ success: true, userId, username });
      }
    } catch (dbErr) {
      console.warn("Firestore error, falling back to local memory storage:", dbErr.message);
    }
    
    // Fallback to local memory
    if (memoryUsers.has(userId)) return res.status(400).json({ error: 'User already exists' });
    memoryUsers.set(userId, { username, password: hashedPassword });
    res.json({ success: true, userId, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    
    const userId = username.toLowerCase().replace(/\s+/g, '-');
    let userData = null;
    
    try {
      if (firestore) {
        const doc = await firestore.collection('users').doc(userId).get();
        if (doc.exists) userData = doc.data();
      }
    } catch (dbErr) {
       console.warn("Firestore error, falling back to local memory:", dbErr.message);
    }
    
    if (!userData) userData = memoryUsers.get(userId);
    if (!userData) return res.status(404).json({ error: 'User not found' });
    
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });
    
    res.json({ success: true, userId, username: userData.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store a consultation case (symptoms + protocol) in Firestore linked to user
app.post('/api/consultation', async (req, res) => {
  try {
    const { userId, username, symptoms, severity, protocolMatched, actionType, transcript, date } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const record = {
      userId,
      username: username || userId,
      symptoms: symptoms || [],
      severity: severity || 'Unknown',
      protocolMatched: protocolMatched || 'Unknown',
      actionType: actionType || 'treat',
      actionSteps: actionSteps || [],
      dangerSigns: dangerSigns || [],
      returnCriteria: returnCriteria || '',
      referralLetterDraft: referralLetterDraft || null,
      patientInitials: patientInitials || null,
      transcript: transcript || '',
      status: status || 'draft',
      date: date || new Date().toISOString()
    };

    try {
      if (firestore) {
        const docRef = await firestore.collection('consultations').add(record);
        // Return the Firestore document ID so the client can reference this case
        return res.json({ success: true, id: docRef.id });
      }
    } catch (dbErr) {
      console.warn("Firestore write error:", dbErr.message);
    }
    
    // Silently succeed even local - data is already in IndexedDB on device
    res.json({ success: true, stored: 'local-only' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const SYSTEM_PROMPT = `You are Saheli, a clinical decision support assistant for community health workers in rural settings.

Analyze the patient transcript and respond ONLY with a JSON object using EXACTLY these field names:

{
  "patientInitials": "string or null",
  "age": number_or_null,
  "sex": "Male" | "Female" | "Unknown",
  "symptoms": ["symptom1", "symptom2"],
  "duration": "string or null",
  "dangerSigns": ["sign1"],
  "severity": "Mild" | "Moderate" | "Moderate-severe" | "Severe",
  "protocolMatched": "specific protocol name like IMCI-ARI, IMCI-Diarrhea, Malaria-RDT, Maternal-Danger, or a descriptive protocol",
  "actionType": "treat" | "refer",
  "actionSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "returnCriteria": "string describing when to return",
  "referralLetterDraft": "string or null (only if actionType is refer)",
  "confidenceScore": 0.0_to_1.0
}

Rules:
- If severity is Moderate-severe or Severe, actionType MUST be "refer"
- protocolMatched must be the specific clinical protocol (e.g., IMCI-ARI for respiratory, IMCI-Diarrhea, Maternal-Danger). Never output "General Triage" unless the case truly has no identifiable protocol.
- actionSteps must be clear, numbered steps for the CHW to perform. Never repeat steps.
- Output ONLY the JSON object, no markdown or explanation.`;

app.post('/api/consult', async (req, res) => {
  try {
    const { transcript, imageBase64 } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server. Contact Administrator.' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Patient Transcript/Description:\n"${transcript}"\n`;
    const parts = [{ text: prompt }];
    
    if (imageBase64) {
      const [header, base64Data] = imageBase64.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: parts,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });
    
    let resultText = response.text;
    // Strip markdown code fences if somehow present despite responseMimeType
    resultText = resultText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    
    const resultJson = JSON.parse(resultText);
    res.json(resultJson);
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: 'AI processing failed', details: err.message });
  }
});

// Get consultations for a specific user — only their records, not others'
app.get('/api/consultations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
      if (firestore) {
        // Only filter by userId — no orderBy to avoid requiring a composite index
        const snapshot = await firestore.collection('consultations')
          .where('userId', '==', userId)
          .limit(100)
          .get();
        
        // Sort by date descending in JavaScript (no Firestore composite index needed)
        const consultations = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
          .slice(0, 50);
        
        return res.json({ consultations });
      }
    } catch (dbErr) {
      console.warn("Firestore read error:", dbErr.message);
    }
    
    // No firestore — return empty (client will show empty state)
    res.json({ consultations: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

// ── Serve built Vite frontend (for production / Cloud Run) ──────────────────
// The dist folder is one level up from backend/ when running in the container
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all: return index.html for any non-API route (SPA routing support)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Saheli backend running on port ${PORT}`);
  console.log(`Serving frontend from: ${distPath}`);
});

import { GoogleGenAI } from '@google/genai';

// In a real app, this should be accessed via a secure proxy, but for 
// client-side MVP without a backend, we might fallback to an exposed key or local input.
// Note: If using direct REST with Vite, you'd usually use import.meta.env.VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ExtractedClinicalData {
  patientInitials?: string;
  age?: number;
  sex?: string;
  symptoms: string[];
  duration?: string;
  vitals?: Record<string, string>;
  dangerSigns: string[];
  confidenceScore: number;
  clarifyingQuestions?: string[];
  severity: "Mild" | "Moderate" | "Moderate-severe" | "Severe";
  protocolMatched?: string;
  actionType: "treat" | "refer";
  actionSteps: string[];
  returnCriteria?: string;
  referralLetterDraft?: string;
  outOfTrainingFlag?: boolean;
}

const SYSTEM_PROMPT = `
You are the clinical engine for Saheli, a rural community health worker (CHW) clinical decision support app.
The CHW will provide a description of the patient's symptoms (via voice transcript or text), and possibly describe an image.
Your task is to parse the input and extract structured clinical data based on WHO IMCI (under-5) and primary care protocols.

CRITICAL RULES:
1. Provide the output as a clean, structured JSON object with the exact keys matching the ExtractedClinicalData schema.
2. If critical information (like age, or hydration status for diarrhea) is missing, generate 1-2 targeted \`clarifyingQuestions\` the CHW should ask (e.g. ["Is the child able to drink?"]). If enough info exists to triage safely, leave this empty.
3. Score \`severity\` conservatively based on WHO red flags.
4. If the case requires a facility, set \`actionType\` to "refer" and generate a \`referralLetterDraft\`.
5. If the case can be managed locally by a CHW, set \`actionType\` to "treat" and provide numbered \`actionSteps\` with conservative WHO-recommended dosages. NEVER hallucinate risky dosages.
6. ALWAYS include a \`returnCriteria\` (e.g., "Return immediately if the fever persists for >3 days or child stops drinking").
7. Set \`outOfTrainingFlag\` to true if the case is complex, surgical, or outside common primary care/tropical disease protocols.
8. Output ONLY valid JSON without markdown wrapping if possible.
`;

export async function processConsultation(transcript: string): Promise<ExtractedClinicalData | null> {
  if (!ai) {
    console.error("Gemini API key not configured.");
    return null;
  }
  
  try {
    const prompt = `Patient Transcript/Description:\n"${transcript}"\n`;
    // For MVP, we pass text. If image exists, it should be appended to the prompt logic.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
      }
    });

    const textPayload = response.text;
    if (textPayload) {
      return JSON.parse(textPayload) as ExtractedClinicalData;
    }
  } catch (err) {
    console.error("Error calling Gemini API:", err);
  }
  return null;
}

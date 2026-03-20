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

export async function processConsultation(transcript: string, imageBase64?: string): Promise<ExtractedClinicalData | null> {
  try {
    const res = await fetch('/api/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, imageBase64 })
    });
    
    if (!res.ok) {
      console.warn("AI Backend failed. Falling back offline.");
      return null;
    }
    
    const data = await res.json();
    return data as ExtractedClinicalData;
  } catch (err) {
    console.error("Network error hitting AI backend:", err);
    return null;
  }
}

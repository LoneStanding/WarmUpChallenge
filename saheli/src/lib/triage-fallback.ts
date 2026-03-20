import type { ExtractedClinicalData } from './ai';

/**
 * A bundled offline fallback engine based roughly on WHO IMCI danger signs.
 * Used when the PWA is offline and cannot reach the Gemini API.
 */
export function runOfflineTriage(transcript: string): ExtractedClinicalData {
  const t = transcript.toLowerCase();
  
  // Basic Regex parsers for an offline MVP
  const isUnder5 = /baby|child|infant|months old|years old/.test(t) && !/adult|man|woman/.test(t);
  
  const symptoms: string[] = [];
  const dangerSigns: string[] = [];
  let severity: "Mild" | "Moderate" | "Moderate-severe" | "Severe" = "Mild";
  let actionType: "treat" | "refer" = "treat";
  const actionSteps: string[] = [];

  // Rules
  if (t.includes('fever')) symptoms.push('Fever');
  if (t.includes('cough')) symptoms.push('Cough');
  if (t.includes('diarrhea') || t.includes('watery stool')) symptoms.push('Diarrhea');
  if (t.includes('rash')) symptoms.push('Rash');
  if (t.includes('wound') || t.includes('cut')) symptoms.push('Wound/Trauma');

  // Danger Signs
  if (t.includes('convulsion') || t.includes('seizure')) dangerSigns.push('Convulsion');
  if (t.includes('unconscious') || t.includes('lethargic') || t.includes('not waking')) dangerSigns.push('Lethargy/Unconsciousness');
  if (t.includes('cannot drink') || t.includes('unable to drink')) dangerSigns.push('Inability to drink/breastfeed');
  if (t.includes('vomiting everything')) dangerSigns.push('Vomiting everything');
  if (t.includes('fast breathing') || t.includes('chest indrawing') || t.includes('hard to breathe')) dangerSigns.push('Respiratory distress/Fast breathing');

  if (dangerSigns.length > 0) {
    severity = 'Severe';
    actionType = 'refer';
    actionSteps.push('Provide immediate pre-referral treatment (e.g., first dose of appropriate antibiotic if IMCI guideline allows).');
    actionSteps.push('Prevent low blood sugar by offering breastmilk or sugar water if conscious.');
    actionSteps.push('Keep the patient warm.');
    actionSteps.push('REFER URGENTLY to nearest hospital.');
  } else if (symptoms.includes('Diarrhea')) {
    severity = 'Moderate';
    actionType = 'treat';
    actionSteps.push('Provide ORS (Oral Rehydration Salts).');
    if (isUnder5) actionSteps.push('Give Zinc supplement (20mg daily for 10-14 days; 10mg if < 6 months).');
  } else if (symptoms.includes('Fever')) {
    severity = 'Moderate';
    actionType = 'treat';
    actionSteps.push('Provide Paracetamol for high fever (>= 38.5 C).');
    actionSteps.push('Perform Rapid Diagnostic Test (RDT) for Malaria if in an endemic area.');
  } else {
    severity = 'Mild';
    actionType = 'treat';
    actionSteps.push('Provide home care advice (fluids, rest).');
  }

  return {
    symptoms: symptoms.length > 0 ? symptoms : ['Unspecified illness'],
    dangerSigns,
    confidenceScore: 0.6, // Low confidence since it's regex based
    severity,
    actionType,
    actionSteps,
    protocolMatched: isUnder5 ? 'Offline WHO IMCI Approximation' : 'Offline Primary Care Approx.',
    returnCriteria: 'Return immediately if patient becomes unable to drink, develops a fever, or breathing becomes difficult.',
    outOfTrainingFlag: false
  };
}

import type { ExtractedClinicalData } from './ai';

interface TriageRule {
  keywords: string[];
  symptomLabel: string;
  isDangerSign?: boolean;
  protocol?: string;
  severity?: "Mild" | "Moderate" | "Moderate-severe" | "Severe";
  actionType?: "treat" | "refer";
  steps?: string[];
}

// Expanded offline NLP keyword rules, based on WHO IMCI + Primary Care guidelines
const SYMPTOM_RULES: TriageRule[] = [
  { keywords: ['fever', 'hot body', 'high temperature', 'temp '], symptomLabel: 'Fever' },
  { keywords: ['cough', 'coughing', 'dry cough', 'wet cough', 'productive cough'], symptomLabel: 'Cough' },
  { keywords: ['diarrhea', 'loose stool', 'watery stool', 'dysentery', 'loose motion'], symptomLabel: 'Diarrhea' },
  { keywords: ['vomiting', 'vomit', 'throwing up', 'nausea'], symptomLabel: 'Vomiting' },
  { keywords: ['rash', 'skin rash', 'spots', 'redness on skin', 'hives'], symptomLabel: 'Skin Rash' },
  { keywords: ['wound', 'cut', 'injury', 'trauma', 'bleeding', 'laceration', 'bruise'], symptomLabel: 'Wound/Trauma' },
  { keywords: ['headache', 'head pain', 'head ache', 'migraine'], symptomLabel: 'Headache' },
  { keywords: ['pain in chest', 'chest pain', 'chest tightness', 'heart pain'], symptomLabel: 'Chest Pain' },
  { keywords: ['abdominal pain', 'stomach pain', 'belly pain', 'tummy pain', 'cramps'], symptomLabel: 'Abdominal Pain' },
  { keywords: ['swelling', 'swollen', 'edema', 'puffiness'], symptomLabel: 'Swelling' },
  { keywords: ['pregnant', 'pregnancy', 'antenatal', 'labour', 'labor', 'miscarriage', 'waterbag'], symptomLabel: 'Pregnancy-related' },
  { keywords: ['burns', 'burn', 'scalded', 'fire'], symptomLabel: 'Burns' },
  { keywords: ['fainting', 'fainted', 'collapse', 'dizzy', 'dizziness', 'lightheaded'], symptomLabel: 'Dizziness/Fainting' },
  { keywords: ['malaria', 'chills', 'shivering', 'night sweat'], symptomLabel: 'Malaria-like illness' },
  { keywords: ['dehydrated', 'dehydration', 'sunken eyes', 'dry mouth', 'not urinating', 'dark urine'], symptomLabel: 'Dehydration signs' },
  { keywords: ['sore throat', 'throat pain', 'difficulty swallowing', 'tonsil'], symptomLabel: 'Sore Throat' },
  { keywords: ['ear pain', 'earache', 'ear discharge', 'ear infection'], symptomLabel: 'Ear Complaint' },
  { keywords: ['eye pain', 'eye discharge', 'red eye', 'blurred vision', 'cannot see'], symptomLabel: 'Eye Complaint' },
  { keywords: ['cannot walk', 'limping', 'leg pain', 'joint pain', 'arthritis'], symptomLabel: 'Mobility/Joint Pain' },
  { keywords: ['snake bite', 'snakebite', 'bitten by snake', 'dog bite', 'animal bite'], symptomLabel: 'Animal Bite' },
];

const DANGER_SIGN_RULES: TriageRule[] = [
  { keywords: ['convulsion', 'seizure', 'fitting', 'fits'], symptomLabel: 'Convulsions/Seizures', isDangerSign: true },
  { keywords: ['unconscious', 'unresponsive', 'not waking', 'coma', 'lethargic', 'very weak'], symptomLabel: 'Loss of Consciousness / Severe Lethargy', isDangerSign: true },
  { keywords: ['cannot drink', 'unable to drink', 'refusing to feed', 'not breastfeeding'], symptomLabel: 'Unable to Drink/Feed', isDangerSign: true },
  { keywords: ['vomiting everything', 'vomits everything', 'cannot keep food down'], symptomLabel: 'Persistent Vomiting', isDangerSign: true },
  { keywords: ['fast breathing', 'chest indrawing', 'hard to breathe', 'respiratory distress', 'cannot breathe', 'shortness of breath', 'gasping'], symptomLabel: 'Severe Respiratory Distress', isDangerSign: true },
  { keywords: ['yellow skin', 'jaundice', 'yellow eyes'], symptomLabel: 'Jaundice', isDangerSign: true },
  { keywords: ['heavy bleeding', 'hemorrhage', 'blood in stool', 'blood in urine', 'coughing blood', 'vomiting blood'], symptomLabel: 'Severe Bleeding', isDangerSign: true },
  { keywords: ['stiff neck', 'neck stiffness', 'cannot flex neck', 'photophobia', 'light hurts eyes'], symptomLabel: 'Meningitis signs', isDangerSign: true },
  { keywords: ['pregnant', 'labour', 'contractions', 'waterbag broken', 'bleeding in pregnancy'], symptomLabel: 'Obstetric Emergency', isDangerSign: true },
  { keywords: ['snake bite', 'snakebite', 'animal bite', 'dog bite', 'scorpion sting'], symptomLabel: 'Envenomation/Bite Emergency', isDangerSign: true },
  { keywords: ['burns'], symptomLabel: 'Severe Burns (potential)', isDangerSign: true },
];

function matchKeywords(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

function guessProtocol(symptoms: string[], dangerSigns: string[], t: string): string {
  if (dangerSigns.some(d => d.includes('Obstetric'))) return 'Maternal-Danger-Protocol';
  if (dangerSigns.some(d => d.includes('Envenomation'))) return 'Envenomation-Emergency';
  if (dangerSigns.some(d => d.includes('Meningitis'))) return 'Meningitis-Protocol';
  if (dangerSigns.some(d => d.includes('Respiratory'))) return 'IMCI-ARI-Severe';
  if (dangerSigns.some(d => d.includes('Convulsion'))) return 'IMCI-Convulsion';
  if (symptoms.includes('Diarrhea') || symptoms.includes('Dehydration signs')) return 'IMCI-Diarrhea-ORS';
  if (symptoms.includes('Cough') || symptoms.some(s => s.includes('Respiratory'))) return 'IMCI-ARI';
  if (symptoms.includes('Malaria-like illness') || (t.includes('malaria') || t.includes('chills'))) return 'Malaria-RDT-Protocol';
  if (symptoms.includes('Fever')) return 'IMCI-Fever-Workup';
  if (symptoms.includes('Pregnancy-related')) return 'ANC-Maternal-Protocol';
  if (symptoms.includes('Wound/Trauma') || symptoms.includes('Burns')) return 'Trauma-First-Aid';
  if (symptoms.includes('Animal Bite')) return 'Envenomation-Bite-Protocol';
  return 'General-IMCI-Assessment';
}

export function runOfflineTriage(transcript: string): ExtractedClinicalData {
  const t = transcript.toLowerCase();

  const isChild = /\b(baby|infant|newborn|neonate|\d+\s*months?\s*old|\d+\s*weeks?\s*old|toddler|child)\b/.test(t) && !/\b(adult|woman|man|lady|gentleman)\b/.test(t);
  const symptoms: string[] = [];
  const dangerSigns: string[] = [];

  for (const rule of SYMPTOM_RULES) {
    if (matchKeywords(t, rule.keywords)) symptoms.push(rule.symptomLabel);
  }
  for (const rule of DANGER_SIGN_RULES) {
    if (matchKeywords(t, rule.keywords)) dangerSigns.push(rule.symptomLabel);
  }

  let severity: "Mild" | "Moderate" | "Moderate-severe" | "Severe" = "Mild";
  let actionType: "treat" | "refer" = "treat";
  const actionSteps: string[] = [];

  if (dangerSigns.length > 0) {
    severity = 'Severe';
    actionType = 'refer';
    actionSteps.push(`Assess immediately: ${dangerSigns[0]} detected.`);
    actionSteps.push('Stabilize the patient: ensure airway is open, keep warm, prevent low blood sugar if conscious.');
    actionSteps.push('REFER URGENTLY to the nearest health facility without delay.');
    if (dangerSigns.some(d => d.includes('Respiratory'))) {
      actionSteps.push('Position upright (semi-sitting). Avoid tight clothing. Count respirations per minute.');
    }
    if (dangerSigns.some(d => d.includes('Convulsion'))) {
      actionSteps.push('Time the seizure. Do NOT insert anything in the mouth. Turn on side to prevent aspiration.');
    }
    if (dangerSigns.some(d => d.includes('Obstetric'))) {
      actionSteps.push('If active labour or bleeding: do NOT delay referral. Support patient position, keep calm.');
    }
  } else if (symptoms.includes('Diarrhea') || symptoms.includes('Dehydration signs')) {
    severity = 'Moderate';
    actionType = 'treat';
    actionSteps.push('Prepare and administer ORS immediately: 1 packet ORS in 1 litre clean water.');
    if (isChild) actionSteps.push('Give Zinc (20mg/day for 14 days; 10mg if under 6 months).');
    actionSteps.push('Return to clinic if: vomiting persists, sunken eyes worsen, or skin pinch is very slow.');
  } else if (symptoms.includes('Malaria-like illness') || (t.includes('chills') && symptoms.includes('Fever'))) {
    severity = 'Moderate';
    actionType = 'treat';
    actionSteps.push('Perform Rapid Diagnostic Test (RDT) for Malaria.');
    actionSteps.push('If RDT positive: administer first-line antimalarial per national protocol.');
    actionSteps.push('Provide Paracetamol for fever (≥ 38.5°C). Encourage oral fluids.');
  } else if (symptoms.includes('Fever') && symptoms.includes('Cough')) {
    severity = 'Moderate';
    actionType = 'treat';
    actionSteps.push('Count respiratory rate. If fast breathing (≥50/min under 1yr, ≥40/min 1-5yr): treat as ARI.');
    actionSteps.push('Give Amoxicillin if ARI is confirmed per IMCI guideline. Provide Paracetamol for fever.');
    actionSteps.push('Advise fluids and return immediately if breathing worsens.');
  } else if (symptoms.includes('Fever')) {
    severity = 'Moderate';
    actionType = 'treat';
    actionSteps.push('Give Paracetamol (15 mg/kg dose) for fever ≥ 38.5°C.');
    actionSteps.push('Perform Malaria RDT if in endemic zone. Encourage oral fluids. Tepid sponge if temp > 39°C.');
    actionSteps.push('Return if no improvement in 48h, or if patient develops danger signs.');
  } else if (symptoms.includes('Wound/Trauma') || symptoms.includes('Burns')) {
    severity = 'Moderate';
    actionType = 'treat';
    actionSteps.push('Clean the wound with clean water and antiseptic. Apply sterile dressing.');
    actionSteps.push('Assess bleeding severity. Apply direct pressure if bleeding is present.');
    actionSteps.push('Refer if wound is deep, involves a tendon/bone, or burn is >10% body surface area.');
  } else if (symptoms.length > 0) {
    severity = 'Mild';
    actionType = 'treat';
    actionSteps.push('Provide supportive care: encourage fluids, rest, and nutritious food.');
    actionSteps.push('Monitor for 24-48 hours. If symptoms worsen or new danger signs appear, return immediately.');
  } else {
    severity = 'Mild';
    actionType = 'treat';
    actionSteps.push('No specific symptoms identified from description. Perform a full clinical assessment.');
    actionSteps.push('Advise the patient to rest and maintain adequate fluid intake.');
  }

  const protocolMatched = guessProtocol(symptoms, dangerSigns, t);

  return {
    symptoms: symptoms.length > 0 ? symptoms : ['Unspecified illness / Insufficient data'],
    dangerSigns,
    confidenceScore: 0.55,
    severity,
    actionType,
    actionSteps: Array.from(new Set(actionSteps)),
    protocolMatched,
    returnCriteria: 'Return immediately if patient becomes unable to drink, develops convulsions, fever spikes, or breathing becomes difficult.',
    outOfTrainingFlag: false,
    patientInitials: undefined,
  };
}

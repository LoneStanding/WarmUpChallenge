import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface PatientFields {
  age?: number;
  sex?: string;
  symptoms: string[];
  duration?: string;
  vitals?: Record<string, string>;
  dangerSigns: string[];
}

export interface Consultation {
  id?: number;
  date: string; // ISO String
  patientInitials?: string;
  fields: PatientFields;
  rawTranscript: string;
  severity: 'Mild' | 'Moderate' | 'Moderate-severe' | 'Severe' | 'Unknown';
  protocolMatched?: string;
  actionCard: {
    type: 'treat' | 'refer' | 'unknown';
    instructions: string[];
    referralLetterDraft?: string;
    returnCriteria?: string;
  };
  status: 'draft' | 'referred' | 'resolved';
}

export class SaheliDatabase extends Dexie {
  consultations!: Table<Consultation, number>;

  constructor() {
    super('SaheliDB');
    this.version(1).stores({
      consultations: '++id, date, severity, status'
    });
  }
}

export const db = new SaheliDatabase();

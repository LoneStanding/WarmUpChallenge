import { useState, useEffect } from 'preact/hooks';
import { Home } from './screens/Home';
import { Processing } from './screens/Processing';
import { DecisionOutput } from './screens/DecisionOutput';
import { ReferralLetter } from './screens/ReferralLetter';
import { CaseHistory } from './screens/CaseHistory';
import type { ExtractedClinicalData } from './lib/ai';
import { processConsultation } from './lib/ai';
import { runOfflineTriage } from './lib/triage-fallback';
import { db } from './lib/db';
import { Globe, WifiOff } from 'lucide-preact';

type Screen = 'Home' | 'Processing' | 'Decision' | 'Referral' | 'History';

// Simple i18n stub structure
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' }
];

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentData, setCurrentData] = useState<ExtractedClinicalData | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<number | null>(null);
  const [language, setLanguage] = useState(LANGUAGES[0].code);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStartConsultation = async (transcript: string) => {
    setCurrentTranscript(transcript);
    setCurrentScreen('Processing');

    let result: ExtractedClinicalData | null = null;
    
    // Minimum 1.5s delay for UI experience
    const minDelay = new Promise(res => setTimeout(res, 1500));
    
    if (isOnline) {
      const [aiResponse] = await Promise.all([processConsultation(transcript), minDelay]);
      result = aiResponse;
    }
    
    // Fallback if offline or AI fails
    if (!result) {
      await minDelay;
      result = runOfflineTriage(transcript);
    }

    setCurrentData(result);
    saveConsultation(transcript, result);
    setCurrentScreen('Decision');
  };

  const saveConsultation = async (trans: string, data: ExtractedClinicalData) => {
    try {
      const id = await db.consultations.add({
        date: new Date().toISOString(),
        patientInitials: data.patientInitials || undefined,
        fields: {
          age: data.age,
          sex: data.sex,
          symptoms: data.symptoms,
          duration: data.duration,
          vitals: data.vitals,
          dangerSigns: data.dangerSigns
        },
        rawTranscript: trans,
        severity: data.severity,
        protocolMatched: data.protocolMatched,
        actionCard: {
          type: data.actionType,
          instructions: data.actionSteps,
          referralLetterDraft: data.referralLetterDraft,
          returnCriteria: data.returnCriteria
        },
        status: 'draft'
      });
      setActiveCaseId(id);
    } catch (e) {
      console.error('Failed to save case:', e);
    }
  };

  const markResolved = async () => {
    if (activeCaseId) {
      await db.consultations.update(activeCaseId, { status: 'resolved' });
    }
    resetToHome();
  };

  const resetToHome = () => {
    setCurrentData(null);
    setCurrentTranscript('');
    setActiveCaseId(null);
    setCurrentScreen('Home');
  };

  const viewCase = async (id: number) => {
    const c = await db.consultations.get(id);
    if (c) {
      setActiveCaseId(c.id!);
      setCurrentData({
        patientInitials: c.patientInitials,
        age: c.fields.age,
        sex: c.fields.sex,
        symptoms: c.fields.symptoms,
        duration: c.fields.duration,
        vitals: c.fields.vitals,
        dangerSigns: c.fields.dangerSigns,
        severity: c.severity as any,
        protocolMatched: c.protocolMatched,
        actionType: c.actionCard.type as any,
        actionSteps: c.actionCard.instructions,
        returnCriteria: c.actionCard.returnCriteria,
        referralLetterDraft: c.actionCard.referralLetterDraft,
        confidenceScore: 1.0, 
      });
      setCurrentTranscript(c.rawTranscript);
      setCurrentScreen('Decision');
    }
  };

  const handleGenerateReferral = async () => {
    if (activeCaseId) {
      await db.consultations.update(activeCaseId, { status: 'referred' });
    }
    setCurrentScreen('Referral');
  };

  return (
    <div class="h-screen w-full bg-slate-100 dark:bg-slate-950 flex justify-center m-0 p-0 font-sans overflow-hidden">
      
      {/* Mobile Device Constraint Wrapper */}
      <div class="w-full max-w-[480px] h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col relative">
        
        {/* Minimal App Chrome / Status Bar */}
        <div class="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-slate-900 z-50">
          <div class="flex items-center gap-2">
            {!isOnline ? (
              <span class="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 py-1 px-2 rounded-md dark:bg-red-900/30">
                <WifiOff class="w-3.5 h-3.5" /> OFFLINE
              </span>
            ) : (
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
              </span>
            )}
          </div>

          <div class="flex items-center gap-1 relative group cursor-pointer text-slate-600 dark:text-slate-300">
            <Globe class="w-4 h-4" />
            <select 
              value={language}
              onChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}
              class="text-xs bg-transparent outline-none font-bold uppercase cursor-pointer appearance-none pr-1"
            >
              {LANGUAGES.map(lang => <option key={lang.code} value={lang.code} class="text-slate-900">{lang.code}</option>)}
            </select>
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 relative pb-20">
          {currentScreen === 'Home' && (
            <Home 
              onStartConsultation={handleStartConsultation} 
              onViewHistory={() => setCurrentScreen('History')}
              onViewCase={viewCase}
            />
          )}

          {currentScreen === 'Processing' && (
            <Processing isOffline={!isOnline} transcript={currentTranscript} />
          )}

          {currentScreen === 'Decision' && currentData && (
            <DecisionOutput 
              data={currentData} 
              onGenerateReferral={handleGenerateReferral}
              onMarkResolved={markResolved}
            />
          )}

          {currentScreen === 'Referral' && currentData && (
            <ReferralLetter 
              data={currentData} 
              onBack={() => setCurrentScreen('Decision')}
            />
          )}

          {currentScreen === 'History' && (
            <CaseHistory 
              onBack={() => setCurrentScreen('Home')} 
              onViewCase={viewCase} 
            />
          )}
        </main>
        
        {/* Safe Area Footer Padding */}
        {currentScreen !== 'Processing' && (
          <div class="absolute bottom-0 w-full p-4 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 pointer-events-none flex justify-center pb-6">
            {currentScreen !== 'Home' && (
               <button onClick={resetToHome} class="text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-auto bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform">
                 Main Menu
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'preact/hooks';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Processing } from './screens/Processing';
import { DecisionOutput } from './screens/DecisionOutput';
import { ReferralLetter } from './screens/ReferralLetter';
import { CaseHistory } from './screens/CaseHistory';
import type { ExtractedClinicalData } from './lib/ai';
import { processConsultation } from './lib/ai';
import { runOfflineTriage } from './lib/triage-fallback';
import { useAuth } from './lib/auth-context';
import { Globe, WifiOff, ArrowLeft, LogOut } from 'lucide-preact';

type Screen = 'Login' | 'Home' | 'Processing' | 'Decision' | 'Referral' | 'History';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' }
];

export function App() {
  const { user, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('Login');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentData, setCurrentData] = useState<ExtractedClinicalData | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [recentCases, setRecentCases] = useState<any[]>([]);

  const navigate = (screen: Screen) => {
    window.location.hash = screen;
  };

  // Hash-based router — no localStorage involved
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as Screen;
      const valid: Screen[] = ['Login', 'Home', 'Processing', 'Decision', 'Referral', 'History'];
      if (hash && valid.includes(hash)) {
        setCurrentScreen(hash);
      } else {
        window.history.replaceState(null, '', '#Login');
        setCurrentScreen('Login');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Redirect to Login when auth is cleared (on logout)
  useEffect(() => {
    if (!user && currentScreen !== 'Login') {
      navigate('Login');
    }
  }, [user]);

  // Load cloud cases when user arrives at Home
  useEffect(() => {
    if (currentScreen === 'Home' && user) {
      fetchUserCases();
    }
  }, [currentScreen, user]);

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

  const fetchUserCases = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/consultations/${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecentCases(data.consultations || []);
      }
    } catch (e) {
      console.warn('Could not load cloud cases:', e);
      setRecentCases([]);
    }
  };

  const handleStartConsultation = async (transcript: string, _type: 'voice' | 'text', imageBase64?: string) => {
    setCurrentTranscript(transcript);
    navigate('Processing');

    let result: ExtractedClinicalData | null = null;
    const minDelay = new Promise(res => setTimeout(res, 1500));

    if (isOnline) {
      const [aiResponse] = await Promise.all([processConsultation(transcript, imageBase64), minDelay]);
      result = aiResponse;
    }

    if (!result) {
      if (isOnline) console.warn('AI backend unreachable. Using offline keyword triage.');
      await minDelay;
      result = runOfflineTriage(transcript);
    }

    setCurrentData(result);
    await saveConsultationToCloud(transcript, result);
    navigate('Decision');
  };

  const saveConsultationToCloud = async (trans: string, data: ExtractedClinicalData): Promise<void> => {
    if (!user) return;
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          username: user.username,
          symptoms: data.symptoms || [],
          severity: data.severity,
          protocolMatched: data.protocolMatched,
          actionType: data.actionType,
          actionSteps: data.actionSteps || [],
          dangerSigns: data.dangerSigns || [],
          returnCriteria: data.returnCriteria,
          referralLetterDraft: data.referralLetterDraft,
          patientInitials: data.patientInitials,
          transcript: trans,
          date: new Date().toISOString(),
          status: 'draft'
        })
      });
      const saved = await res.json();
      if (saved.id) setActiveCaseId(saved.id);
    } catch (e) {
      console.warn('Cloud save failed silently:', e);
    }
  };

  const markResolved = async () => {
    if (activeCaseId) {
      fetch(`/api/consultation/${activeCaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      }).catch(() => {});
    }
    resetToHome();
  };

  const resetToHome = () => {
    setCurrentData(null);
    setCurrentTranscript('');
    setActiveCaseId(null);
    navigate('Home');
  };

  const viewCase = (caseData: any) => {
    setCurrentData({
      patientInitials: caseData.patientInitials,
      symptoms: caseData.symptoms || [],
      dangerSigns: caseData.dangerSigns || [],
      severity: caseData.severity,
      protocolMatched: caseData.protocolMatched,
      actionType: caseData.actionType,
      actionSteps: caseData.actionSteps || [],
      returnCriteria: caseData.returnCriteria,
      referralLetterDraft: caseData.referralLetterDraft,
      confidenceScore: 1.0,
    });
    setCurrentTranscript(caseData.transcript || '');
    navigate('Decision');
  };

  const handleGenerateReferral = async () => {
    if (activeCaseId) {
      fetch(`/api/consultation/${activeCaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'referred' })
      }).catch(() => {});
    }
    navigate('Referral');
  };

  // Guard: if user somehow lands on Decision/Referral without data, push to Home
  useEffect(() => {
    if ((currentScreen === 'Decision' || currentScreen === 'Referral') && !currentData) {
      navigate('Home');
    }
  }, [currentScreen, currentData]);

  const isLoginScreen = currentScreen === 'Login';

  return (
    <div class="h-screen w-full bg-slate-100 dark:bg-slate-950 flex justify-center m-0 p-0 font-sans overflow-hidden">
      <div class="w-full max-w-7xl h-full bg-white dark:bg-slate-950 md:shadow-2xl flex flex-col relative md:border-x border-slate-200 dark:border-slate-800">
        
        {/* App Bar */}
        <div class="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-slate-900 z-50">
          <div class="flex items-center gap-2">
            {!isLoginScreen && currentScreen !== 'Home' && currentScreen !== 'Processing' && (
              <button onClick={() => window.history.back()} class="mr-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                <ArrowLeft class="w-5 h-5" />
              </button>
            )}
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

          <div class="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Globe class="w-4 h-4" />
            <select
              value={language}
              onChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}
              class="text-xs bg-transparent outline-none font-bold uppercase cursor-pointer appearance-none"
            >
              {LANGUAGES.map(lang => <option key={lang.code} value={lang.code} class="text-slate-900">{lang.code}</option>)}
            </select>

            {/* Always show logout on all screens except login */}
            {!isLoginScreen && (
              <button
                onClick={logout}
                title="Logout"
                class="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">LOGOUT</span>
              </button>
            )}
          </div>
        </div>

        {/* Screen Content */}
        <main class="flex-1 overflow-y-auto overflow-x-hidden relative">
          {currentScreen === 'Login' && (
            <div class="h-full flex items-center justify-center p-4">
              <Login />
            </div>
          )}

          {currentScreen === 'Home' && (
            <div class="max-w-4xl mx-auto h-full p-4 md:p-8">
              <Home
                username={user?.username}
                recentCases={recentCases}
                onStartConsultation={handleStartConsultation}
                onViewHistory={() => navigate('History')}
                onViewCase={viewCase}
              />
            </div>
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
              onBack={() => navigate('Decision')}
            />
          )}

          {currentScreen === 'History' && (
            <CaseHistory
              cases={recentCases}
              onRefresh={fetchUserCases}
              onBack={() => navigate('Home')}
              onViewCase={viewCase}
            />
          )}
        </main>

        {/* Floating footer */}
        {!isLoginScreen && currentScreen !== 'Processing' && currentScreen !== 'Home' && (
          <div class="absolute bottom-0 w-full p-4 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 pointer-events-none flex justify-center pb-6">
            <button onClick={resetToHome} class="text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-auto bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform">
              Main Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

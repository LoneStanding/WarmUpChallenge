import { useState } from 'preact/hooks';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Mic, Square, Edit3, ImagePlus, User, AlertTriangle, X } from 'lucide-preact';
import { voiceManager } from '../lib/voice';

interface HomeProps {
  username?: string;
  recentCases: any[];
  onStartConsultation: (transcript: string, type: 'voice' | 'text', imageBase64?: string) => void;
  onViewHistory: () => void;
  onViewCase: (caseData: any) => void;
}

export function Home({ username, recentCases, onStartConsultation, onViewHistory, onViewCase }: HomeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [isManualText, setIsManualText] = useState(false);

  const handleToggleRecord = () => {
    if (isRecording) {
      voiceManager.stop();
      setIsRecording(false);
      setTimeout(() => {
        if (transcript.trim() || photoBase64) {
          onStartConsultation(transcript, 'voice', photoBase64);
        }
      }, 500);
    } else {
      if (!voiceManager.isSupported) {
        alert("Speech API is not supported in this browser.");
        return;
      }
      setTranscript('');
      setIsRecording(true);
      voiceManager.start(
        (text) => setTranscript(text),
        () => setIsRecording(false),
        navigator.language
      );
    }
  };

  const submitManualText = () => {
    if (transcript.trim() || photoBase64) {
      onStartConsultation(transcript, 'text', photoBase64);
    } else {
      alert("Please describe symptoms or add a photo.");
    }
  };

  const handlePhotoUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoBase64(ev.target?.result as string);
      setIsManualText(true);
    };
    reader.onerror = () => alert("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  return (
    <div class="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Header */}
      <div class="mb-6 md:mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Saheli</h1>
        {username ? (
          <p class="text-slate-500 font-medium">Welcome back, <span class="text-emerald-600 font-bold">{username}</span> 👋</p>
        ) : (
          <p class="text-slate-500 font-medium">Rural Triage Bridge</p>
        )}
      </div>

      <div class="md:grid md:grid-cols-2 md:gap-8 lg:gap-12 flex-1 items-start">
        
        {/* Left Column: Input Card */}
        <div class="mb-8 md:mb-0 space-y-5 flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          
          {/* Smaller mic button: w-16 h-16 */}
          <button
            onClick={handleToggleRecord}
            class={`relative flex shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isRecording ? 'w-20 h-20 bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse' : 'w-16 h-16 bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl active:scale-95'}`}
          >
            {isRecording ? <Square class="w-8 h-8 text-white" /> : <Mic class="w-7 h-7 text-white" />}
          </button>
          
          <p class={`text-base font-bold text-center ${isRecording ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
            {isRecording ? '🔴 Recording… tap to stop' : 'Tap to speak symptoms'}
          </p>

          {/* Type / Photo buttons: show when idle */}
          {!isRecording && !isManualText && !transcript && !photoBase64 && (
            <div class="flex w-full gap-3 px-2">
              <Button variant="secondary" fullWidth class="gap-2 text-slate-600 dark:text-slate-300 shadow-sm" onClick={() => setIsManualText(true)}>
                <Edit3 class="w-4 h-4" /> Type Input
              </Button>
              <Button variant="secondary" fullWidth class="gap-2 text-slate-600 dark:text-slate-300 shadow-sm relative overflow-hidden group">
                <input type="file" accept="image/*" capture="environment" class="absolute inset-0 opacity-0 z-50 w-full h-full cursor-pointer" onChange={handlePhotoUpload} />
                <ImagePlus class="w-4 h-4 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                <span class="pointer-events-none text-sm">Add Photo</span>
              </Button>
            </div>
          )}

          {/* Live transcript / text input area */}
          {(isRecording || isManualText || transcript || photoBase64) && (
            <div class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/30 rounded-2xl p-4 shadow-inner mt-2">
              {photoBase64 && (
                <div class="relative mb-3 inline-block">
                  <img src={photoBase64} alt="Patient photo" class="h-24 w-auto rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 object-cover" />
                  <button class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-sm hover:bg-red-600" onClick={() => setPhotoBase64(undefined)}>
                    <X class="w-4 h-4" />
                  </button>
                </div>
              )}
              <textarea
                class="w-full h-24 bg-transparent resize-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
                placeholder="Describe age, symptoms, duration..."
                value={transcript}
                onInput={(e) => setTranscript((e.currentTarget as HTMLTextAreaElement).value)}
                disabled={isRecording}
              />
              {!isRecording && (
                <div class="flex gap-2 justify-end mt-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsManualText(false); setTranscript(''); setPhotoBase64(undefined); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={submitManualText}>
                    Analyze
                  </Button>
                </div>
              )}
            </div>
          )}

          {!voiceManager.isSupported && (
            <p class="text-amber-600 text-xs font-semibold text-center flex items-center justify-center gap-1">
              <AlertTriangle class="w-4 h-4"/> Voice not supported in this environment.
            </p>
          )}
        </div>

        {/* Right Column: Recent Cases (cloud-loaded) */}
        <div class={`flex-1 overflow-y-auto ${(!transcript && !isRecording && !isManualText && !photoBase64) ? 'block' : 'hidden md:block'}`}>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-700 dark:text-slate-200">Your Recent Cases</h3>
            <button onClick={onViewHistory} class="text-emerald-600 font-bold text-sm tracking-wide hover:underline">VIEW ALL</button>
          </div>
          
          <div class="space-y-3">
            {recentCases.slice(0, 3).map((c, i) => (
              <Card key={i} class="p-4 hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-emerald-100" onClick={() => onViewCase(c)}>
                <div class="flex justify-between items-start mb-1">
                  <div class="font-bold text-slate-800 dark:text-white text-sm truncate pr-4">
                    {(c.symptoms || []).slice(0, 2).join(', ') || 'Unknown symptoms'}
                  </div>
                  <Badge variant={c.severity as any}>{c.severity}</Badge>
                </div>
                <div class="text-xs text-slate-400 font-medium flex justify-between">
                  <span>{c.protocolMatched || 'General'}</span>
                  <span>{c.date ? new Date(c.date).toLocaleDateString() : ''}</span>
                </div>
              </Card>
            ))}
            {recentCases.length === 0 && (
              <div class="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <User class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p class="text-slate-500 font-medium text-sm">No cases yet</p>
                <p class="text-slate-400 text-xs mt-1">Your consultations will appear here</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

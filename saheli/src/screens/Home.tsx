import { useState, useEffect } from 'preact/hooks';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Mic, Square, Edit3, ImagePlus, User, AlertTriangle } from 'lucide-preact';
import { voiceManager } from '../lib/voice';
import { db } from '../lib/db';
import type { Consultation } from '../lib/db';

interface HomeProps {
  onStartConsultation: (transcript: string, type: 'voice' | 'text') => void;
  onViewHistory: () => void;
  onViewCase: (id: number) => void;
}

export function Home({ onStartConsultation, onViewHistory, onViewCase }: HomeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recentCases, setRecentCases] = useState<Consultation[]>([]);
  const [isManualText, setIsManualText] = useState(false);

  useEffect(() => {
    loadRecentCases();
  }, []);

  const loadRecentCases = async () => {
    try {
      const cases = await db.consultations.orderBy('date').reverse().limit(3).toArray();
      setRecentCases(cases);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      voiceManager.stop();
      setIsRecording(false);
      // Wait a tick for the final transcript hook to fire, or manually send it if using interim
      setTimeout(() => {
        if (transcript.trim()) {
          onStartConsultation(transcript, 'voice');
        }
      }, 500);
    } else {
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
    if (transcript.trim()) {
      onStartConsultation(transcript, 'text');
    }
  };

  return (
    <div class="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Header */}
      <div class="mb-6">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Saheli</h1>
        <p class="text-slate-500 font-medium">Rural Triage Bridge</p>
      </div>

      {/* Main Input Area */}
      <div class="flex-1 flex flex-col items-center justify-center space-y-6">
        
        {/* Large Mic Button */}
        <button
          onClick={handleToggleRecord}
          class={`relative flex items-center justify-center rounded-full transition-all duration-300 ${isRecording ? 'w-32 h-32 bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.5)] animate-pulse' : 'w-24 h-24 bg-emerald-600 hover:bg-emerald-700 shadow-xl hover:shadow-2xl active:scale-95'}`}
        >
          {isRecording ? <Square class="w-12 h-12 text-white" /> : <Mic class="w-10 h-10 text-white" />}
        </button>
        
        <p class={`text-lg font-bold ${isRecording ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
          {isRecording ? 'Listening...' : 'Tap to speak symptoms'}
        </p>

        {/* Live Transcript / Manual Input box */}
        {(isRecording || isManualText || transcript) && (
          <div class="w-full bg-slate-50 dark:bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-4 shadow-inner relative mt-4">
            <textarea
              class="w-full h-24 bg-transparent resize-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              placeholder="Describe age, symptoms, duration..."
              value={transcript}
              onInput={(e) => setTranscript((e.target as HTMLTextAreaElement).value)}
              disabled={isRecording}
            />
            {!isRecording && isManualText && (
              <Button size="sm" class="absolute bottom-3 right-3" onClick={submitManualText}>
                Analyze
              </Button>
            )}
          </div>
        )}

        {/* Action Row */}
        {!isRecording && !isManualText && (
          <div class="flex w-full gap-3 mt-4">
            <Button variant="secondary" fullWidth class="gap-2 text-slate-600 dark:text-slate-300 shadow-sm" onClick={() => setIsManualText(true)}>
              <Edit3 class="w-4 h-4" /> Type Input
            </Button>
            <Button variant="secondary" fullWidth class="gap-2 text-slate-600 dark:text-slate-300 shadow-sm">
              <ImagePlus class="w-4 h-4" /> Add Photo
            </Button>
          </div>
        )}

        {!voiceManager.isSupported && (
          <p class="text-amber-600 text-sm font-semibold text-center mt-2 flex items-center justify-center gap-1">
            <AlertTriangle class="w-4 h-4"/> Voice not supported offline/on this device.
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div class="mt-8 mb-4">
        <div class="flex justify-between items-end mb-3">
          <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest">Recent Consults</h3>
          <button class="text-sm font-bold text-emerald-600 dark:text-emerald-400" onClick={onViewHistory}>View All</button>
        </div>
        
        <div class="space-y-2">
          {recentCases.map((c) => (
            <Card key={c.id} onClick={() => c.id && onViewCase(c.id)} class="flex justify-between items-center py-3 pl-3 pr-4 active:bg-slate-50 dark:active:bg-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                  {c.patientInitials || <User class="w-5 h-5"/>}
                </div>
                <div>
                  <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.fields.symptoms[0] || 'Unknown'}</p>
                  <p class="text-xs text-slate-400 font-medium">{new Date(c.date).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant={c.severity}>{c.severity}</Badge>
            </Card>
          ))}
          {recentCases.length === 0 && (
            <p class="text-center text-slate-500 text-sm py-4">No recent cases stored on this device.</p>
          )}
        </div>
      </div>
    </div>
  );
}

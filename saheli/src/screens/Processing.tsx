
import { Loader2, Activity, ServerCrash } from 'lucide-preact';
import { Card } from '../components/ui/Card';

interface ProcessingProps {
  isOffline: boolean;
  transcript: string;
}

export function Processing({ isOffline, transcript }: ProcessingProps) {
  return (
    <div class="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 text-center px-4">
      
      <div class="relative w-24 h-24 mb-8">
        {/* Pulsing ring */}
        <div class="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-900/40 animate-ping opacity-75"></div>
        {/* Inner circle */}
        <div class="absolute inset-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
          <Loader2 class="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
        </div>
      </div>

      <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        Analyzing Case...
      </h2>
      
      {isOffline ? (
        <p class="text-amber-600 dark:text-amber-500 font-medium mb-6 flex items-center justify-center gap-2">
          <ServerCrash class="w-4 h-4"/> Offline Mode: Limited Protocol
        </p>
      ) : (
        <p class="text-slate-500 dark:text-slate-400 font-medium mb-6 flex items-center justify-center gap-2">
          <Activity class="w-4 h-4"/> Matching clinical protocols
        </p>
      )}

      <Card class="w-full text-left bg-slate-50 dark:bg-slate-900/50 shadow-inner mt-4 opacity-70">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transcript Audio / Text</p>
        <p class="text-sm font-medium text-slate-700 dark:text-slate-300 italic line-clamp-3">
          "{transcript}"
        </p>
      </Card>

    </div>
  );
}

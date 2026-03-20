
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { ExtractedClinicalData } from '../lib/ai';
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-preact';

interface DecisionOutputProps {
  data: ExtractedClinicalData;
  onGenerateReferral: () => void;
  onMarkResolved: () => void;
}

export function DecisionOutput({ data, onGenerateReferral, onMarkResolved }: DecisionOutputProps) {
  const isRefer = data.actionType === 'refer';
  const hasDangerSigns = data.dangerSigns && data.dangerSigns.length > 0;

  return (
    <div class="flex flex-col h-full space-y-3 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Patient Summary Bar */}
      <div class="flex items-center justify-between px-1">
        <div>
          <h2 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {data.patientInitials || 'Patient'}
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {data.age ? `${data.age} yrs` : 'Age N/A'} • {data.sex || 'Unknown sex'}
          </p>
        </div>
        <Badge variant={data.severity} class="text-sm px-3 py-1 shadow-sm">
          {data.severity}
        </Badge>
      </div>

      {/* Protocol Warning */}
      {data.outOfTrainingFlag && (
        <div class="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r-lg dark:bg-indigo-900/20">
          <p class="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
            Note: Complex case outside primary training. Refer to physician if unsure.
          </p>
        </div>
      )}

      {/* Danger Signs */}
      {hasDangerSigns && (
        <Card class="bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50">
          <div class="flex items-start">
            <AlertTriangle class="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div class="ml-3">
              <h3 class="text-sm font-bold text-red-800 dark:text-red-400 uppercase tracking-wider mb-1">Danger Signs</h3>
              <ul class="list-disc pl-4 text-sm text-red-700 dark:text-red-300 font-medium space-y-0.5">
                {data.dangerSigns.map((sign) => <li key={sign}>{sign}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Action Card */}
      <Card class={`border-2 ${isRefer ? 'border-red-500 dark:border-red-600' : 'border-emerald-500 dark:border-emerald-600'}`}>
        <div class="mb-3 border-b pb-2 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            Protocol: {data.protocolMatched || 'General Triage'}
          </h3>
          <p class={`text-xl font-extrabold mt-1 ${isRefer ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {isRefer ? 'Urgent Referral' : 'Treat Locally'}
          </p>
        </div>
        
        <ol class="space-y-3 mt-4">
          {data.actionSteps.map((step, idx) => (
            <li key={idx} class="flex gap-3 text-slate-800 dark:text-slate-200 font-medium text-15px">
              <span class="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-500">
                {idx + 1}
              </span>
              <span class="leading-snug">{step}</span>
            </li>
          ))}
        </ol>

        {data.returnCriteria && (
          <div class="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span class="text-amber-600 dark:text-amber-500">⚠ Return if:</span> {data.returnCriteria}
            </p>
          </div>
        )}
      </Card>

      {/* Structured Data Summary (Collapsible or compact) */}
      <Card class="bg-slate-50 dark:bg-slate-800/40">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Extracted Data</h3>
        <p class="text-sm text-slate-700 dark:text-slate-300"><span class="font-semibold">Symptoms:</span> {data.symptoms.join(', ')}</p>
        {data.duration && <p class="text-sm text-slate-700 dark:text-slate-300"><span class="font-semibold">Duration:</span> {data.duration}</p>}
      </Card>

      <div class="text-xs text-center text-slate-400 pt-1 pb-2 font-medium">
        Disclaimer: Decision support only. Clinical judgment overrides.
      </div>

      {/* Primary Actions */}
      <div class="grid grid-cols-2 gap-3 mt-auto pt-2">
        <Button 
          variant={isRefer ? 'primary' : 'secondary'} 
          onClick={onGenerateReferral}
          class="flex gap-2"
        >
          <FileText class="w-5 h-5" /> Let's Refer
        </Button>
        <Button 
          variant={!isRefer ? 'primary' : 'secondary'} 
          onClick={onMarkResolved}
          class="flex gap-2"
        >
          <CheckCircle2 class="w-5 h-5" /> Resolved
        </Button>
      </div>

    </div>
  );
}

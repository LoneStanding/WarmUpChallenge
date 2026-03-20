
import { useState, useEffect } from 'preact/hooks';
import { db } from '../lib/db';
import type { Consultation } from '../lib/db';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Filter, Search } from 'lucide-preact';

interface CaseHistoryProps {
  onBack: () => void;
  onViewCase: (id: number) => void;
}

export function CaseHistory({ onBack, onViewCase }: CaseHistoryProps) {
  const [cases, setCases] = useState<Consultation[]>([]);

  useEffect(() => {
    loadAllCases();
  }, []);

  const loadAllCases = async () => {
    try {
      const allCases = await db.consultations.orderBy('date').reverse().toArray();
      setCases(allCases);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div class="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
      
      <div class="flex items-center gap-3 mb-6">
        <button onClick={onBack} class="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft class="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Case History</h2>
      </div>

      <div class="flex gap-2 mb-4">
        <div class="relative flex-1">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search symptoms..." 
            class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <Button variant="secondary" size="sm" class="gap-2 shrink-0 border border-slate-200 dark:border-slate-700">
          <Filter class="w-4 h-4" /> Filter
        </Button>
      </div>

      <div class="flex-1 overflow-y-auto space-y-3 -mx-4 px-4 pb-4">
        {cases.map((c) => (
          <Card key={c.id} onClick={() => c.id && onViewCase(c.id)} class="flex flex-col p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/50">
            <div class="flex items-start justify-between mb-2">
              <div>
                <p class="font-bold text-slate-900 dark:text-slate-100">{c.patientInitials || 'Unknown Patient'}</p>
                <p class="text-xs font-semibold text-slate-500">
                  {new Date(c.date).toLocaleDateString()} • {new Date(c.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
              <Badge variant={c.severity}>{c.severity}</Badge>
            </div>
            
            <p class="text-sm text-slate-700 dark:text-slate-300 font-medium line-clamp-1 mb-3">
              <span class="text-slate-500">Signs:</span> {c.fields.symptoms.join(', ')}
            </p>

            <div class="flex justify-between items-center mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span class={`text-xs font-extrabold uppercase tracking-wide ${c.status === 'referred' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {c.status}
              </span>
              <span class="text-xs font-bold text-slate-400 uppercase">
                {c.protocolMatched || 'Triage'}
              </span>
            </div>
          </Card>
        ))}

        {cases.length === 0 && (
          <div class="flex flex-col items-center justify-center h-40 text-slate-500">
            <p class="font-medium">No past cases found.</p>
          </div>
        )}
      </div>

    </div>
  );
}

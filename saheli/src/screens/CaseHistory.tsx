import { useState } from 'preact/hooks';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Search, RefreshCw } from 'lucide-preact';

interface CaseHistoryProps {
  cases: any[];
  onRefresh: () => void;
  onBack: () => void;
  onViewCase: (caseData: any) => void;
}

export function CaseHistory({ cases, onRefresh, onBack, onViewCase }: CaseHistoryProps) {
  const [query, setQuery] = useState('');

  const filtered = query
    ? cases.filter((c) => {
        const symptoms = (c.symptoms || []).join(' ').toLowerCase();
        const protocol = (c.protocolMatched || '').toLowerCase();
        const q = query.toLowerCase();
        return symptoms.includes(q) || protocol.includes(q) || (c.severity || '').toLowerCase().includes(q);
      })
    : cases;

  return (
    <div class="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300 p-4 md:p-8">
      
      <div class="flex items-center gap-3 mb-6">
        <button onClick={onBack} class="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft class="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white flex-1">Case History</h2>
        <button onClick={onRefresh} title="Refresh from cloud" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-emerald-600">
          <RefreshCw class="w-5 h-5" />
        </button>
      </div>

      <div class="relative mb-4">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by symptom, protocol, severity..."
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div class="flex-1 overflow-y-auto space-y-3 -mx-4 px-4 pb-4">
        {filtered.map((c, i) => (
          <Card key={i} onClick={() => onViewCase(c)} class="flex flex-col p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/50 cursor-pointer">
            <div class="flex items-start justify-between mb-2">
              <div>
                <p class="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {(c.symptoms || []).slice(0, 3).join(', ') || 'Unknown Symptoms'}
                </p>
                <p class="text-xs font-semibold text-slate-500">
                  {c.date ? new Date(c.date).toLocaleDateString() : ''} • {c.date ? new Date(c.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </p>
              </div>
              <Badge variant={c.severity}>{c.severity}</Badge>
            </div>

            <div class="flex justify-between items-center mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span class={`text-xs font-extrabold uppercase tracking-wide ${c.status === 'referred' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {c.status || 'Draft'}
              </span>
              <span class="text-xs font-bold text-slate-400 uppercase">
                {c.protocolMatched || 'General'}
              </span>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div class="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
            <p class="font-medium">{query ? 'No matching cases.' : 'No past cases found.'}</p>
            {!query && (
              <Button variant="secondary" size="sm" onClick={onRefresh} class="gap-2">
                <RefreshCw class="w-4 h-4" /> Load from Cloud
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

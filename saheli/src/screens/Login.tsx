import { useState } from 'preact/hooks';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User, Key, ServerCrash, Loader2 } from 'lucide-preact';
import { useAuth } from '../lib/auth-context';

export function Login() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        const errStr = data.error || 'Authentication failed';
        setError(errStr);
        setLoading(false);
        return;
      }
      
      // Store auth in memory-only context — no localStorage
      login(data.userId, data.username);
      // Navigate via hash router
      window.location.hash = 'Home';
    } catch (err) {
      setError('Network error. Ensure the backend server is running.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div class="flex flex-col items-center justify-center min-h-[80vh] px-6 animate-in fade-in duration-500 max-w-md mx-auto">
      <div class="mb-10 text-center">
        <div class="w-20 h-20 bg-emerald-100 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-inner">
          <span class="text-4xl">🩺</span>
        </div>
        <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Saheli</h1>
        <p class="text-slate-500 font-medium mt-2">Community Health Triage</p>
      </div>

      <Card class="w-full p-6 space-y-5 shadow-lg relative overflow-hidden">
        <div class="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>

        {error && (
          <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-100 dark:bg-red-900/30 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div class="space-y-1.5">
          <label class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <User class="w-4 h-4 text-emerald-600" /> Username / CHW ID
          </label>
          <input
            type="text"
            placeholder="e.g. Nurse Jane"
            value={username}
            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900 dark:text-slate-100"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Key class="w-4 h-4 text-emerald-600" /> Password
          </label>
          <input
            type="password"
            placeholder="Enter secure password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900 dark:text-slate-100"
          />
        </div>

        <Button onClick={handleSubmit} fullWidth variant="primary" size="lg" class="mt-4 shadow-md font-bold text-lg gap-2" disabled={loading}>
          {loading && <Loader2 class="w-5 h-5 animate-spin" />}
          {isLogin ? 'Log In' : 'Create Account'}
        </Button>
        
        <div class="pt-2 text-center text-sm font-medium">
           <button class="text-emerald-600 hover:text-emerald-500 transition-colors" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
             {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
           </button>
        </div>
      </Card>

      <div class="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
        <ServerCrash class="w-4 h-4" /> Securely connected to Saheli Cloud
      </div>
    </div>
  );
}

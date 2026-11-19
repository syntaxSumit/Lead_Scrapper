import { useState, useEffect } from 'react';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { IconTarget } from '../components/ui/Icons.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api from '../api/axios.js';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { handleLogin, handleRegister, loading } = useAuth();

  // shortcut: warm up Render server early while user types credentials
  useEffect(() => {
    api.get('/health').catch(() => {});
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    if (isRegister) {
      handleRegister(name, email, password);
    } else {
      handleLogin(email, password);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <Card className="w-full max-w-md p-8 shadow-2xl relative z-10 border border-emerald-500/20">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white font-bold mb-3.5 shadow-lg shadow-emerald-950/50 border border-emerald-400/30">
            <IconTarget className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            LeadScout
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Local Business Lead Finder & AI Website Analyzer for Agencies
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {isRegister && (
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@agency.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="w-full mt-3 h-[42px] text-sm">
            {loading ? <Spinner size={4} /> : isRegister ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-white/[0.06]">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors ml-1"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </Card>
    </div>
  );
}

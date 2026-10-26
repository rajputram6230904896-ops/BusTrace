import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Check,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types/transit';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, switchUser, allDemoUsers } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('Student');
  const [organization, setOrganization] = useState('Aryans Group of Colleges, Rajpura');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      if (!email.trim()) {
        setFeedbackMsg({ text: 'Please enter a valid email address.', isError: true });
        return;
      }
      login(email, role);
      setFeedbackMsg({ text: 'Signed in successfully! Welcome to BusTrace.' });
      setTimeout(() => {
        onClose();
        setFeedbackMsg(null);
      }, 1000);
    } else if (mode === 'signup') {
      if (!name.trim() || !email.trim()) {
        setFeedbackMsg({ text: 'Please provide both your name and email.', isError: true });
        return;
      }
      signup(name, email, role, organization);
      setFeedbackMsg({ text: 'Account registered! You can now post live bus reports.' });
      setTimeout(() => {
        onClose();
        setFeedbackMsg(null);
      }, 1000);
    } else if (mode === 'forgot') {
      setFeedbackMsg({
        text: 'Password reset link sent to your email (simulated demo flow).',
      });
      setTimeout(() => {
        setMode('login');
        setFeedbackMsg(null);
      }, 2000);
    }
  };

  const handleQuickPersona = (user: UserProfile) => {
    switchUser(user);
    setFeedbackMsg({ text: `Switched active profile to ${user.name} (${user.role}).` });
    setTimeout(() => {
      onClose();
      setFeedbackMsg(null);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">
              {mode === 'login' && 'Sign In to BusTrace'}
              {mode === 'signup' && 'Create Commuter Account'}
              {mode === 'forgot' && 'Reset BusTrace Password'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'login' && 'Access saved corridors and report verified bus arrivals'}
              {mode === 'signup' && 'Join students and commuters building transparent transit'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMsg.isError
                ? 'bg-rose-950/70 border border-rose-800 text-rose-200'
                : 'bg-emerald-950/70 border border-emerald-800 text-emerald-200'
            }`}
          >
            {feedbackMsg.isError ? (
              <span className="text-rose-400 font-bold">!</span>
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Quick Demo Switcher Section */}
        <div className="my-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="block text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Instant Sign In (Demo Personas)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {allDemoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickPersona(u)}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left text-xs text-slate-200 transition-colors cursor-pointer border border-slate-700/60 truncate"
              >
                <div className="font-semibold truncate">{u.name.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-400 truncate">{u.role}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Jaspreet Kaur"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. commuter@punjab.transit.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
              />
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Commuter Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserProfile['role'])}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Student">Student Commuter</option>
                  <option value="Commuter">Daily Work Commuter</option>
                  <option value="Volunteer">Transit Volunteer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Institution / Route Hub</label>
                <input
                  type="text"
                  placeholder="e.g. Punjabi University, Chitkara, Thapar, ISBT"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {mode === 'login' && (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
            {mode === 'signup' && (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            )}
            {mode === 'forgot' && (
              <>
                <KeyRound className="w-4 h-4" /> Send Recovery Link
              </>
            )}
          </button>
        </form>

        {/* Footer switchers */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === 'login' && (
            <div>
              Don't have an account yet?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                Sign up free
              </button>
            </div>
          )}
          {mode === 'signup' && (
            <div>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                Sign in
              </button>
            </div>
          )}
          {mode === 'forgot' && (
            <div>
              Remember your password?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                Back to Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

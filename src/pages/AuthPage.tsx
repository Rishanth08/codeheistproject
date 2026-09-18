import { useState } from 'react';
import { Activity, User, Phone, Car, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(loginEmail, loginPassword);
    if (err) setError(err);
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signUp(signupEmail, signupPassword, fullName, phone, vehicleReg);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#070b14]">
      {/* Left: brand panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/40 via-[#070b14] to-teal-900/30" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, #38bdf8 0%, transparent 40%), radial-gradient(circle at 80% 70%, #2dd4bf 0%, transparent 40%)',
        }} />

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center glow-cyan">
              <Activity className="w-8 h-8 text-slate-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                MapMatch<span className="text-gradient">AI</span>
              </h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-[0.2em] font-medium">
                Indian ITS Map-Matching
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight mb-4 max-w-md">
            Next-Gen AI/ML Highway vs Service Road Classification
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-8">
            Real-time GPS telemetry processing with Kalman filtering, HMM transition
            scoring, and ML classification across India's National Highway network.
          </p>

          <div className="space-y-3 max-w-md">
            <FeatureItem text="Kalman-filtered GNSS preprocessing for Indian urban canyons" />
            <FeatureItem text="Live classification on NH-48, NE-1, NH-44 & more" />
            <FeatureItem text="Confidence-scored road type detection (Highway vs Service Road)" />
            <FeatureItem text="Register via phone number or vehicle ID for GPS sync" />
          </div>
        </div>
      </div>

      {/* Right: auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center glow-cyan">
              <Activity className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              MapMatch<span className="text-gradient">AI</span>
            </h1>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 p-1 glass rounded-xl mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SIGN UP
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {mode === 'login'
              ? 'Sign in with your registered phone/vehicle ID and password.'
              : 'Register your vehicle and phone for real-time GPS map-matching.'}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field
                icon={<Mail className="w-4 h-4" />}
                label="Registered Phone / Vehicle ID (Email)"
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="you@example.com"
                required
              />
              <Field
                icon={<Lock className="w-4 h-4" />}
                label="Password / OTP"
                type="password"
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="••••••••"
                required
              />
              <SubmitButton loading={loading} text="LOGIN" />
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <Field
                icon={<User className="w-4 h-4" />}
                label="Full Name"
                type="text"
                value={fullName}
                onChange={setFullName}
                placeholder="Rajesh Kumar"
                required
              />
              <Field
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                type="email"
                value={signupEmail}
                onChange={setSignupEmail}
                placeholder="rajesh@example.com"
                required
              />
              <Field
                icon={<Phone className="w-4 h-4" />}
                label="Phone Number (For GPS Sync)"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="+91 98765 43210"
                required
              />
              <Field
                icon={<Car className="w-4 h-4" />}
                label="Vehicle Registration Number"
                type="text"
                value={vehicleReg}
                onChange={setVehicleReg}
                placeholder="DL 01 AB 1234"
                required
              />
              <Field
                icon={<Lock className="w-4 h-4" />}
                label="Password"
                type="password"
                value={signupPassword}
                onChange={setSignupPassword}
                placeholder="••••••••"
                required
              />
              <SubmitButton loading={loading} text="REGISTER" />
            </form>
          )}

          <p className="text-center text-[11px] text-slate-600 mt-6">
            By continuing, you agree to the MapMatchAI Indian ITS Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
        <ArrowRight className="w-2.5 h-2.5 text-sky-400" />
      </div>
      <span className="text-sm text-slate-400">{text}</span>
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/60 border border-sky-500/15 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/10 transition-all"
        />
      </div>
    </div>
  );
}

function SubmitButton({ loading, text }: { loading: boolean; text: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-400 text-slate-900 font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 glow-cyan"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
      {text}
    </button>
  );
}

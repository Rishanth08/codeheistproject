import {
  Activity,
  BarChart3,
  Compass,
  Database,
  Radio,
  LogOut,
  User,
  Car,
} from 'lucide-react';
import type { TabId } from '@/App';
import { useAuth } from '@/lib/auth';

interface Props {
  active: TabId;
  onChange: (t: TabId) => void;
}

const NAV = [
  { id: 'live' as TabId, label: 'Live Simulation', icon: Radio, desc: 'Real-time map-matching' },
  { id: 'analytics' as TabId, label: 'Algorithm Analytics', icon: BarChart3, desc: 'Model performance' },
  { id: 'errors' as TabId, label: 'GPS Error Metrics', icon: Compass, desc: 'Accuracy analysis' },
  { id: 'datasets' as TabId, label: 'Dataset Explorer', icon: Database, desc: 'Training corpora' },
];

export default function Sidebar({ active, onChange }: Props) {
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-72 shrink-0 h-full flex flex-col glass-strong border-r border-sky-500/15">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 border-b border-sky-500/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center glow-cyan">
              <Activity className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0d1424] animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white leading-tight tracking-tight">
              MapMatch<span className="text-gradient">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em] font-medium">
              Indian ITS Engine
            </p>
          </div>
        </div>
      </div>

      {/* User profile card */}
      {profile && (
        <div className="mx-3 mt-3 mb-1">
          <div className="glass rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500/30 to-teal-400/30 border border-sky-500/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{profile.full_name}</div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Car className="w-2.5 h-2.5" />
                <span className="truncate">{profile.vehicle_reg || 'No vehicle'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-slate-600 font-semibold">
          Command Center
        </p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-transparent text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-gradient-to-b from-sky-400 to-teal-400" />
              )}
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
                strokeWidth={2}
              />
              <div className="text-left flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight">{item.label}</div>
                <div className="text-[10px] text-slate-600 truncate">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Status footer */}
      <div className="px-4 py-4 border-t border-sky-500/10 space-y-3">
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              System Status
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-[10px] text-emerald-400 font-medium">ONLINE</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <Stat label="Model" value="v3.2.1" />
            <Stat label="Latency" value="12ms" />
            <Stat label="Uptime" value="99.97%" />
            <Stat label="Throughput" value="8.4k/s" />
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-600">© 2026 MapMatch AI</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1 text-slate-600 hover:text-rose-400 transition-colors text-[10px] font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-slate-600">{label}</span>
      <span className="text-slate-300 font-semibold">{value}</span>
    </div>
  );
}

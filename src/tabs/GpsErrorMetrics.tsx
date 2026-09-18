import { useMemo } from 'react';
import {
  Compass,
  AlertTriangle,
  Gauge,
  TrendingDown,
  Crosshair,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, Badge } from '@/components/ui';
import { ERROR_DISTRIBUTION, generateErrorTimeSeries } from '@/sim/analytics';

export default function GpsErrorMetrics() {
  const series = useMemo(() => generateErrorTimeSeries(42), []);

  const rawErrors = series.map((s) => s.rawError);
  const matchedErrors = series.map((s) => s.matchedError);
  const maxRaw = Math.max(...rawErrors);
  const avgRaw = rawErrors.reduce((a, b) => a + b, 0) / rawErrors.length;
  const avgMatched = matchedErrors.reduce((a, b) => a + b, 0) / matchedErrors.length;
  const p95Raw = rawErrors.sort((a, b) => a - b)[Math.floor(rawErrors.length * 0.95)];
  const improvement = ((avgRaw - avgMatched) / avgRaw) * 100;

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3">
        <Compass className="w-6 h-6 text-sky-400" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">GPS Error Metrics</h1>
          <p className="text-xs text-slate-500">Positional accuracy before and after map-matching correction</p>
        </div>
        <div className="flex-1" />
        <Badge color="emerald">{improvement.toFixed(0)}% improvement</Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <ErrorKpi
          icon={<Crosshair className="w-4 h-4" />}
          label="Mean Raw Error"
          value={`${avgRaw.toFixed(1)}m`}
          sub="pre-correction"
          color="rose"
        />
        <ErrorKpi
          icon={<Crosshair className="w-4 h-4" />}
          label="Mean Matched Error"
          value={`${avgMatched.toFixed(2)}m`}
          sub="post-correction"
          color="emerald"
        />
        <ErrorKpi
          icon={<AlertTriangle className="w-4 h-4" />}
          label="P95 Raw Error"
          value={`${p95Raw.toFixed(1)}m`}
          sub="95th percentile"
          color="amber"
        />
        <ErrorKpi
          icon={<TrendingDown className="w-4 h-4" />}
          label="Error Reduction"
          value={`${improvement.toFixed(1)}%`}
          sub="avg improvement"
          color="sky"
        />
      </div>

      {/* Time series */}
      <Card>
        <CardHeader
          title="Error Over Time"
          subtitle="Raw GPS vs map-matched positional error"
          icon={<Activity className="w-4 h-4" />}
          right={
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-rose-500" />
                <span className="text-[10px] text-slate-400">Raw GPS</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-sky-400" />
                <span className="text-[10px] text-slate-400">Matched</span>
              </span>
            </div>
          }
        />
        <div className="px-5 pb-5">
          <LineChart series={series} maxVal={maxRaw + 5} />
          <div className="flex justify-between mt-2 text-[9px] text-slate-600">
            <span>t = 0s</span>
            <span>t = 40s</span>
          </div>
        </div>
      </Card>

      {/* Error distribution + radial */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader
            title="Error Distribution"
            subtitle="Histogram of positional error by road type"
            icon={<Gauge className="w-4 h-4" />}
            right={
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                  <span className="text-[10px] text-slate-400">Highway</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" />
                  <span className="text-[10px] text-slate-400">Service</span>
                </span>
              </div>
            }
          />
          <div className="px-5 pb-5">
            <Histogram />
          </div>
        </Card>

        <Card>
          <CardHeader title="Accuracy Radial" subtitle="Confidence by segment" icon={<Crosshair className="w-4 h-4" />} />
          <div className="px-5 pb-5 flex items-center justify-center">
            <RadialGauge value={96.8} />
          </div>
        </Card>
      </div>

      {/* CDF table */}
      <Card>
        <CardHeader title="Cumulative Error Percentiles" subtitle="Error at each percentile threshold" icon={<Compass className="w-4 h-4" />} />
        <div className="px-5 pb-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-sky-500/10">
                <th className="text-left py-2 font-semibold">Percentile</th>
                <th className="text-right py-2 font-semibold">Raw GPS (m)</th>
                <th className="text-right py-2 font-semibold">Matched (m)</th>
                <th className="text-right py-2 font-semibold">Reduction</th>
                <th className="text-right py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { p: 'P50', raw: 4.8, matched: 1.2 },
                { p: 'P75', raw: 9.3, matched: 2.1 },
                { p: 'P90', raw: 16.7, matched: 3.4 },
                { p: 'P95', raw: 24.1, matched: 4.8 },
                { p: 'P99', raw: 38.5, matched: 8.2 },
              ].map((row) => {
                const red = ((row.raw - row.matched) / row.raw) * 100;
                return (
                  <tr key={row.p} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-300">{row.p}</td>
                    <td className="py-2.5 text-right tabular-nums text-rose-400">{row.raw.toFixed(1)}</td>
                    <td className="py-2.5 text-right tabular-nums text-emerald-400">{row.matched.toFixed(1)}</td>
                    <td className="py-2.5 text-right tabular-nums text-sky-400">{red.toFixed(1)}%</td>
                    <td className="py-2.5 text-right">
                      <Badge color={red > 70 ? 'emerald' : red > 50 ? 'sky' : 'amber'}>
                        {red > 70 ? 'excellent' : red > 50 ? 'good' : 'fair'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ErrorKpi({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    rose: 'text-rose-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    sky: 'text-sky-400',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={colorMap[color]}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${colorMap[color]}`}>{value}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{label}</div>
      <div className="text-[9px] text-slate-600 mt-0.5">{sub}</div>
    </Card>
  );
}

function LineChart({ series, maxVal }: { series: { t: number; rawError: number; matchedError: number }[]; maxVal: number }) {
  const w = 800;
  const h = 200;
  const pad = 20;

  const xScale = (t: number) => pad + (t / (series.length - 1)) * (w - 2 * pad);
  const yScale = (v: number) => h - pad - (v / maxVal) * (h - 2 * pad);

  const rawPath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(s.rawError)}`).join(' ');
  const matchedPath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(s.matchedError)}`).join(' ');
  const rawArea = `${rawPath} L ${xScale(series.length - 1)} ${h - pad} L ${xScale(0)} ${h - pad} Z`;

  // grid lines
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((f) => pad + f * (h - 2 * pad));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48" preserveAspectRatio="none">
      <defs>
        <linearGradient id="raw-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((y, i) => (
        <line key={i} x1={pad} y1={y} x2={w - pad} y2={y} stroke="#1e293b" strokeWidth="0.5" />
      ))}
      <path d={rawArea} fill="url(#raw-grad)" />
      <path d={rawPath} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinejoin="round" />
      <path d={matchedPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function Histogram() {
  const maxVal = Math.max(...ERROR_DISTRIBUTION.flatMap((b) => [b.highway, b.service]));
  return (
    <div className="space-y-3">
      {ERROR_DISTRIBUTION.map((bucket) => (
        <div key={bucket.label} className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 w-14 tabular-nums">{bucket.label}</span>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1">
              <div className="flex-1 h-3 rounded-sm bg-slate-800/60 overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-sm transition-all duration-700"
                  style={{ width: `${(bucket.highway / maxVal) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-sky-400 tabular-nums w-8 text-right">{bucket.highway}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-3 rounded-sm bg-slate-800/60 overflow-hidden">
                <div
                  className="h-full bg-teal-400 rounded-sm transition-all duration-700"
                  style={{ width: `${(bucket.service / maxVal) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-teal-400 tabular-nums w-8 text-right">{bucket.service}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RadialGauge({ value }: { value: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ * 0.75; // 270 degree gauge
  return (
    <div className="relative w-44 h-44">
      <svg viewBox="0 0 180 180" className="w-full h-full -rotate-[135deg]">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#1e293b" strokeWidth="10" strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="10"
          strokeDasharray={`${circ * 0.75 * (value / 100)} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white tabular-nums">{value}%</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Accuracy</span>
      </div>
    </div>
  );
}

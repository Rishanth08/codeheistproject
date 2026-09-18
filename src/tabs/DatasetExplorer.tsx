import { useState } from 'react';
import {
  Database,
  Search,
  Filter,
  Download,
  MapPin,
  Clock,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, Badge } from '@/components/ui';
import { DATASET_RECORDS, type DatasetRecord } from '@/sim/analytics';

export default function DatasetExplorer() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<DatasetRecord | null>(DATASET_RECORDS[0] ?? null);

  const filters = ['all', 'Highway', 'Service Road', 'Transition', 'Mixed'];

  const filtered = DATASET_RECORDS.filter((r) => {
    const matchesQuery =
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.scenario.toLowerCase().includes(query.toLowerCase()) ||
      r.id.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || r.roadType === filter;
    return matchesQuery && matchesFilter;
  });

  const totalSamples = DATASET_RECORDS.reduce((a, r) => a + r.samples, 0);
  const avgAccuracy = DATASET_RECORDS.reduce((a, r) => a + r.accuracy, 0) / DATASET_RECORDS.length;

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3">
        <Database className="w-6 h-6 text-sky-400" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Dataset Explorer</h1>
          <p className="text-xs text-slate-500">Training and validation corpora for the map-matching engine</p>
        </div>
        <div className="flex-1" />
        <Badge color="sky">{DATASET_RECORDS.length} datasets</Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <DsKpi icon={<Database className="w-4 h-4" />} label="Total Samples" value={totalSamples.toLocaleString()} color="sky" />
        <DsKpi icon={<TrendingUp className="w-4 h-4" />} label="Avg Accuracy" value={`${avgAccuracy.toFixed(1)}%`} color="emerald" />
        <DsKpi icon={<MapPin className="w-4 h-4" />} label="Routes Mapped" value="148" color="teal" />
        <DsKpi icon={<Clock className="w-4 h-4" />} label="Total Hours" value="1,240h" color="amber" />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-6">
        {/* Table */}
        <Card>
          <CardHeader
            title="Dataset Catalog"
            subtitle={`${filtered.length} matching records`}
            icon={<Database className="w-4 h-4" />}
            right={
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search datasets..."
                    className="w-44 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-800/60 border border-sky-500/15 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors"
                  />
                </div>
              </div>
            }
          />
          {/* Filter chips */}
          <div className="px-5 pb-3 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  filter === f
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-sky-500/10">
                  <th className="text-left px-5 py-2.5 font-semibold">Dataset</th>
                  <th className="text-left py-2.5 font-semibold">Scenario</th>
                  <th className="text-right py-2.5 font-semibold">Samples</th>
                  <th className="text-right py-2.5 font-semibold">Accuracy</th>
                  <th className="text-right py-2.5 font-semibold">Mean Err</th>
                  <th className="text-left py-2.5 font-semibold">Type</th>
                  <th className="text-right py-2.5 font-semibold pr-5">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`border-b border-slate-800/40 cursor-pointer transition-colors ${
                      selected?.id === r.id ? 'bg-sky-500/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-white text-xs">{r.name}</div>
                      <div className="text-[10px] text-slate-600 tabular-nums">{r.id}</div>
                    </td>
                    <td className="py-3 text-xs text-slate-400">{r.scenario}</td>
                    <td className="py-3 text-right tabular-nums text-slate-300 text-xs">{r.samples.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={`text-xs font-bold tabular-nums ${r.accuracy > 95 ? 'text-emerald-400' : r.accuracy > 90 ? 'text-sky-400' : 'text-amber-400'}`}>
                        {r.accuracy.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-400 text-xs">{r.meanError.toFixed(1)}m</td>
                    <td className="py-3">
                      <Badge color={typeColor(r.roadType)}>{r.roadType}</Badge>
                    </td>
                    <td className="py-3 text-right text-[10px] text-slate-500 tabular-nums pr-5">{r.date}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-600 text-xs">
                      No datasets match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail panel */}
        <div className="space-y-4">
          {selected && (
            <>
              <Card className="p-5 animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{selected.id}</div>
                    <h3 className="text-base font-bold text-white mt-0.5">{selected.name}</h3>
                    <Badge color={typeColor(selected.roadType)} className="mt-2">{selected.roadType}</Badge>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>

                <div className="space-y-3">
                  <DetailRow label="Scenario" value={selected.scenario} />
                  <DetailRow label="Date Collected" value={selected.date} />
                  <DetailRow label="Total Samples" value={selected.samples.toLocaleString()} />
                  <div className="h-px bg-sky-500/10" />
                  <DetailRow label="Overall Accuracy" value={`${selected.accuracy.toFixed(1)}%`} highlight={selected.accuracy > 95 ? 'emerald' : 'amber'} />
                  <DetailRow label="Mean Error" value={`${selected.meanError.toFixed(1)} m`} />
                  <DetailRow label="P95 Error" value={`${selected.p95Error.toFixed(1)} m`} />
                </div>

                {/* Error bar viz */}
                <div className="mt-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Error Distribution</div>
                  <div className="flex h-6 rounded-md overflow-hidden">
                    <div className="bg-emerald-500/70" style={{ width: '60%' }} title="0-5m" />
                    <div className="bg-sky-500/70" style={{ width: '22%' }} title="5-10m" />
                    <div className="bg-amber-500/70" style={{ width: '13%' }} title="10-20m" />
                    <div className="bg-rose-500/70" style={{ width: '5%' }} title="20+m" />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-slate-600">
                    <span>0-5m</span>
                    <span>5-10m</span>
                    <span>10-20m</span>
                    <span>20m+</span>
                  </div>
                </div>

                <button className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition-all">
                  <Download className="w-3.5 h-3.5" />
                  Export Dataset
                </button>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Quality Report</span>
                </div>
                <div className="space-y-2.5">
                  <QualityRow label="Coverage" value={94} />
                  <QualityRow label="Label Consistency" value={97} />
                  <QualityRow label="Sensor Diversity" value={88} />
                  <QualityRow label="Temporal Balance" value={91} />
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function typeColor(type: string): 'sky' | 'teal' | 'amber' | 'slate' {
  switch (type) {
    case 'Highway': return 'sky';
    case 'Service Road': return 'teal';
    case 'Transition': return 'amber';
    default: return 'slate';
  }
}

function DsKpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    sky: 'text-sky-400',
    emerald: 'text-emerald-400',
    teal: 'text-teal-400',
    amber: 'text-amber-400',
  };
  return (
    <Card className="p-4">
      <div className={`${colorMap[color]} mb-2`}>{icon}</div>
      <div className={`text-2xl font-bold tabular-nums ${colorMap[color]}`}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </Card>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: 'emerald' | 'amber' }) {
  const highlightColor = highlight === 'emerald' ? 'text-emerald-400' : highlight === 'amber' ? 'text-amber-400' : 'text-slate-200';
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${highlightColor}`}>{value}</span>
    </div>
  );
}

function QualityRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-400 transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

import {
  BarChart3,
  GitBranch,
  Brain,
  CheckCircle2,
  Satellite,
  Boxes,
  Layers,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, Badge } from '@/components/ui';
import {
  FEATURE_WEIGHTS,
  CONFUSION_MATRIX,
  PIPELINE_STEPS,
} from '@/sim/analytics';

const PIPELINE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  satellite: Satellite,
  cluster: Boxes,
  'git-branch': GitBranch,
  brain: Brain,
  'check-circle': CheckCircle2,
};

export default function AlgorithmAnalytics() {
  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-sky-400" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Algorithm Analytics</h1>
          <p className="text-xs text-slate-500">Model architecture, feature weights, and classification performance</p>
        </div>
        <div className="flex-1" />
        <Badge color="emerald">Model v3.2.1</Badge>
        <Badge color="sky">96.8% F1</Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Overall Accuracy" value="96.8%" delta="+1.2%" color="emerald" icon={<Target className="w-4 h-4" />} />
        <KpiCard label="F1 Score" value="0.968" delta="+0.008" color="sky" icon={<TrendingUp className="w-4 h-4" />} />
        <KpiCard label="Mean Error" value="5.2m" delta="-0.8m" color="teal" icon={<Layers className="w-4 h-4" />} />
        <KpiCard label="Inference" value="12ms" delta="-3ms" color="amber" icon={<Brain className="w-4 h-4" />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Feature Importance */}
        <Card>
          <CardHeader
            title="Feature Importance"
            subtitle="Gradient-boosted tree weights"
            icon={<BarChart3 className="w-4 h-4" />}
            right={<Badge color="sky">SHAP-based</Badge>}
          />
          <div className="px-5 pb-5 space-y-4">
            {FEATURE_WEIGHTS.map((f) => (
              <div key={f.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-slate-300 font-medium">{f.name}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: f.color }}>
                    {(f.weight * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-800/60 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${f.weight * 100}%`,
                      background: `linear-gradient(90deg, ${f.color}, ${f.color}aa)`,
                      boxShadow: `0 0 12px ${f.color}66`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-1">{featureDesc(f.name)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Confusion Matrix */}
        <Card>
          <CardHeader
            title="Confusion Matrix"
            subtitle="Highway vs Service Road classification"
            icon={<Target className="w-4 h-4" />}
            right={<Badge color="emerald">N = 104,620</Badge>}
          />
          <div className="px-5 pb-5">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
              <div />
              <div className="text-center text-[11px] font-semibold text-sky-400 pb-1">Pred: Highway</div>
              <div className="text-center text-[11px] font-semibold text-teal-400 pb-1">Pred: Service</div>

              {CONFUSION_MATRIX.map((cell, i) => {
                const showActual = i % 2 === 0;
                return (
                  <ConfusionRow key={i} cell={cell} showActual={showActual} />
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatBox label="Precision" value="95.5%" color="text-sky-400" />
              <StatBox label="Recall" value="98.2%" color="text-teal-400" />
              <StatBox label="Specificity" value="95.4%" color="text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader
          title="Algorithm Pipeline"
          subtitle="End-to-end map-matching workflow"
          icon={<GitBranch className="w-4 h-4" />}
          right={<Badge color="slate">5 stages</Badge>}
        />
        <div className="px-5 pb-6 pt-2">
          <div className="relative">
            {/* connecting line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-sky-500/40 via-teal-500/40 to-emerald-500/40" />
            <div className="grid grid-cols-5 gap-3 relative">
              {PIPELINE_STEPS.map((step, i) => {
                const Icon = PIPELINE_ICONS[step.icon] ?? Satellite;
                return (
                  <div key={step.id} className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div
                      className={`relative w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border transition-all hover:scale-110 ${
                        i === 0
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : i === PIPELINE_STEPS.length - 1
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-sky-500/30 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                        {step.id}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white leading-tight">{step.title}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 mb-1.5">{step.subtitle}</div>
                    <p className="text-[10px] text-slate-600 leading-snug max-w-[180px]">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Model breakdown */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-semibold text-white">HMM Parameters</span>
          </div>
          <div className="space-y-2">
            <ParamRow label="States" value="2 (HWY, SR)" />
            <ParamRow label="Emission model" value="Gaussian" />
            <ParamRow label="Transition matrix" value="Learned" />
            <ParamRow label="Decoding" value="Viterbi" />
            <ParamRow label="Sigma (GPS)" value="14.2m" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-semibold text-white">ML Classifier</span>
          </div>
          <div className="space-y-2">
            <ParamRow label="Algorithm" value="XGBoost" />
            <ParamRow label="Trees" value="480" />
            <ParamRow label="Max depth" value="7" />
            <ParamRow label="Features" value="23" />
            <ParamRow label="Training set" value="104k samples" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Validation</span>
          </div>
          <div className="space-y-2">
            <ParamRow label="Cross-val" value="5-fold" />
            <ParamRow label="Holdout" value="18.2k" />
            <ParamRow label="Best epoch" value="247" />
            <ParamRow label="Early stop" value="patience=20" />
            <ParamRow label="AUC-ROC" value="0.991" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function featureDesc(name: string): string {
  switch (name) {
    case 'Spatial Distance':
      return 'Great-circle distance from GPS fix to candidate road link';
    case 'Heading Drift':
      return 'Angular difference between GPS bearing and road segment heading';
    case 'Speed Profile':
      return 'Vehicle speed consistency with road-class speed priors';
    case 'Transition Probability':
      return 'HMM transition likelihood between adjacent road links';
    default:
      return '';
  }
}

function KpiCard({ label, value, delta, color, icon }: { label: string; value: string; delta: string; color: string; icon: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    sky: 'text-sky-400',
    teal: 'text-teal-400',
    amber: 'text-amber-400',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`${colorMap[color]}`}>{icon}</span>
        <span className="text-[10px] text-emerald-400 font-medium">{delta}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${colorMap[color]}`}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </Card>
  );
}

function ConfusionRow({ cell, showActual }: { cell: { actual: string; predicted: string; value: number; correct: boolean }; showActual: boolean }) {
  return (
    <>
      {showActual && (
        <div
          className={`flex items-center justify-end pr-2 text-[11px] font-semibold ${
            cell.actual === 'Highway' ? 'text-sky-400' : 'text-teal-400'
          }`}
        >
          {cell.actual}
        </div>
      )}
      {!showActual && <div />}
      <div
        className={`relative rounded-lg p-3 flex flex-col items-center justify-center min-h-[72px] border transition-all hover:scale-[1.02] ${
          cell.correct
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-rose-500/10 border-rose-500/30'
        }`}
      >
        <span className={`text-lg font-bold tabular-nums ${cell.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
          {cell.value}%
        </span>
        <span className="text-[9px] text-slate-500 mt-0.5">
          {cell.correct ? 'correct' : 'misclassified'}
        </span>
      </div>
    </>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-lg p-2.5 text-center">
      <div className={`text-base font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  );
}

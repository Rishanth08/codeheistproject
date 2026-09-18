import { useEffect, useRef, useState } from 'react';
import {
  Gauge,
  Navigation,
  Mountain,
  Radar,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  Cpu,
  Waves,
  TrendingUp,
  Radio,
  MapPin,
  Crosshair,
  Wifi,
} from 'lucide-react';
import MapView from '@/components/MapView';
import { Badge, Card, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { INDIAN_HIGHWAYS, type IndianHighway } from '@/sim/indianHighways';
import { TelemetryGenerator } from '@/sim/telemetryGenerator';
import { MapMatcher, type MapMatchResult } from '@/sim/mapMatcher';
import { supabase } from '@/lib/supabase';
import type { LatLng } from '@/sim/types';

export default function LiveSimulation() {
  const { profile } = useAuth();
  const [highway, setHighway] = useState<IndianHighway>(INDIAN_HIGHWAYS[0]);
  const [running, setRunning] = useState(false);
  const [speedFactor, setSpeedFactor] = useState(2);
  const [result, setResult] = useState<MapMatchResult | null>(null);
  const [rawPath, setRawPath] = useState<LatLng[]>([]);
  const [matchedPath, setMatchedPath] = useState<LatLng[]>([]);
  const [filteredPath, setFilteredPath] = useState<LatLng[]>([]);
  const [history, setHistory] = useState<MapMatchResult[]>([]);
  const [highwayOpen, setHighwayOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [connected, setConnected] = useState(false);

  const genRef = useRef<TelemetryGenerator | null>(null);
  const matcherRef = useRef<MapMatcher | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // init generator + matcher
  useEffect(() => {
    const deviceId = profile?.phone_number || profile?.vehicle_reg || 'unknown-device';
    const gen = new TelemetryGenerator(INDIAN_HIGHWAYS[0], deviceId, 85);
    const matcher = new MapMatcher(INDIAN_HIGHWAYS[0]);
    genRef.current = gen;
    matcherRef.current = matcher;

    // Generate first point
    const firstInput = gen.next();
    if (firstInput) {
      const r = matcher.match(firstInput);
      setResult(r);
      setRawPath([r.rawPosition]);
      setMatchedPath([r.matchedPosition]);
      setFilteredPath([r.filteredPosition]);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [profile]);

  const changeHighway = (h: IndianHighway) => {
    setHighway(h);
    genRef.current?.setHighway(h);
    matcherRef.current?.setHighway(h);
    setHighwayOpen(false);
    setRunning(false);
    resetSimulation();
  };

  const resetSimulation = () => {
    genRef.current?.reset();
    matcherRef.current?.reset();
    setRawPath([]);
    setMatchedPath([]);
    setFilteredPath([]);
    setHistory([]);
    setProgress(0);
    setResult(null);
  };

  useEffect(() => {
    genRef.current?.setSpeedFactor?.(speedFactor);
  }, [speedFactor]);

  // animation loop
  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setConnected(false);
      return;
    }

    setConnected(true);

    const loop = (ts: number) => {
      if (!lastTickRef.current) lastTickRef.current = ts;
      const dt = ts - lastTickRef.current;
      const interval = Math.max(60, 300 / speedFactor);

      if (dt > interval) {
        lastTickRef.current = ts;
        const gen = genRef.current;
        const matcher = matcherRef.current;
        if (gen && matcher) {
          if (gen.isFinished()) {
            gen.reset();
            setRawPath([]);
            setMatchedPath([]);
            setFilteredPath([]);
          }
          const input = gen.next();
          if (input) {
            const r = matcher.match(input);
            setResult(r);
            setRawPath((prev) => [...prev, r.rawPosition].slice(-300));
            setMatchedPath((prev) => [...prev, r.matchedPosition].slice(-300));
            setFilteredPath((prev) => [...prev, r.filteredPosition].slice(-300));
            setHistory((prev) => [...prev, r].slice(-200));
            setProgress(gen.getProgress());

            // Log telemetry to Supabase (fire and forget)
            supabase.from('telemetry_logs').insert({
              device_id: r.deviceId,
              latitude: r.matchedPosition.lat,
              longitude: r.matchedPosition.lng,
              altitude: r.altitude,
              speed_kmh: r.speedKmh,
              heading_degrees: r.bearing,
              highway_name: r.highwayName,
              road_type: r.roadType,
              confidence_score: r.confidenceScore,
              raw_latitude: r.rawPosition.lat,
              raw_longitude: r.rawPosition.lng,
            }).then(() => {});
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [running, speedFactor]);

  const handleReset = () => {
    setRunning(false);
    resetSimulation();
    // Generate first point again
    const gen = genRef.current;
    const matcher = matcherRef.current;
    if (gen && matcher) {
      const input = gen.next();
      if (input) {
        const r = matcher.match(input);
        setResult(r);
        setRawPath([r.rawPosition]);
        setMatchedPath([r.matchedPosition]);
        setFilteredPath([r.filteredPosition]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Top control bar */}
      <div className="glass-strong border-b border-sky-500/15 px-5 py-3 flex items-center gap-3 flex-wrap z-20">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Live Telemetry</h2>
            <p className="text-[10px] text-slate-500">Real-time GPS map-matching — Indian Highway Network</p>
          </div>
        </div>

        <div className="w-px h-8 bg-sky-500/15 mx-1" />

        {/* Connection status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${connected ? 'bg-emerald-500/15' : 'bg-slate-700/30'} transition-colors`}>
          <Wifi className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className={`text-[10px] font-semibold ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
            {connected ? 'LIVE TELEMETRY: CONNECTED' : 'TELEMETRY: IDLE'}
          </span>
        </div>

        <div className="flex-1" />

        {/* Highway selector */}
        <div className="relative">
          <button
            onClick={() => setHighwayOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass hover:border-sky-500/30 transition-all min-w-[240px]"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <div className="text-left flex-1">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Indian Highway</div>
              <div className="text-xs font-semibold text-white">{highway.fullName}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${highwayOpen ? 'rotate-180' : ''}`} />
          </button>
          {highwayOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-80 glass-strong rounded-xl p-1.5 z-30 shadow-2xl animate-fade-in">
              {INDIAN_HIGHWAYS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => changeHighway(h)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                    h.id === highway.id ? 'bg-sky-500/15 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="text-xs font-semibold">{h.fullName}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{h.city}, {h.state}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-1.5 glass rounded-lg px-2 py-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">Speed</span>
          {[1, 2, 4, 8].map((f) => (
            <button
              key={f}
              onClick={() => setSpeedFactor(f)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                speedFactor === f
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f}x
            </button>
          ))}
        </div>

        {/* Play/pause + reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              running
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 glow-cyan'
            }`}
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white glass transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            highwayPath={highway.centerline}
            servicePath={highway.serviceRoad}
            rawPath={rawPath}
            matchedPath={matchedPath}
            filteredPath={filteredPath}
            vehiclePos={result?.matchedPosition ?? null}
            vehicleRaw={result?.rawPosition ?? null}
            roadClass={result?.roadType === 'Highway' ? 'highway' : 'service'}
          />

          {/* Progress bar overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 bg-gradient-to-t from-[#070b14]/90 to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-medium tabular-nums w-10">
                {Math.round(progress * 100)}%
              </span>
              <ProgressBar value={progress} className="flex-1" />
              <span className="text-[10px] text-slate-500 tabular-nums">
                Step {genRef.current?.getStep() ?? 0} / {genRef.current?.getTotalSteps() ?? 0}
              </span>
            </div>
          </div>

          {/* Legend overlay */}
          <div className="absolute top-4 left-4 z-10 glass rounded-xl p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Legend</div>
            <LegendItem color="#f43f5e" label="Raw GPS (noisy)" dashed />
            <LegendItem color="#a78bfa" label="Kalman Filtered" thin />
            <LegendItem color="#2563eb" label="Map-Matched" />
            <LegendItem color="#fbbf24" label="Highway" thin />
            <LegendItem color="#64748b" label="Service Road" thin />
          </div>

          {/* Classification output overlay */}
          {result && (
            <div className="absolute top-4 right-4 z-10 glass-strong rounded-xl p-4 min-w-[260px]">
              <div className="flex items-center gap-2 mb-3">
                <Crosshair className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Map-Match Output
                </span>
              </div>

              {/* JSON-style output */}
              <div className="font-mono text-[11px] space-y-1 bg-slate-900/60 rounded-lg p-3 border border-sky-500/10">
                <div><span className="text-slate-500">"device_id":</span> <span className="text-emerald-400">"{result.deviceId}"</span></div>
                <div><span className="text-slate-500">"status":</span> <span className="text-emerald-400">"{result.status}"</span></div>
                <div><span className="text-slate-500">"highway_name":</span> <span className="text-sky-400">"{result.highwayName}"</span></div>
                <div><span className="text-slate-500">"road_type":</span> <span className={result.roadType === 'Highway' ? 'text-amber-400' : 'text-slate-300'}>"{result.roadType}"</span></div>
                <div><span className="text-slate-500">"confidence":</span> <span className="text-teal-400">{(result.confidenceScore * 100).toFixed(1)}%</span></div>
              </div>

              {/* Visual badges */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Current Route</span>
                  <span className="text-sm font-bold text-amber-400">{result.highwayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Segment Type</span>
                  <Badge color={result.roadType === 'Highway' ? 'sky' : 'teal'}>
                    {result.roadType === 'Highway' ? 'HIGHWAY' : 'SERVICE ROAD'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Confidence</span>
                  <span className="text-sm font-bold text-emerald-400">{(result.confidenceScore * 100).toFixed(1)}%</span>
                </div>
                <ProgressBar
                  value={result.confidenceScore}
                  color={result.roadType === 'Highway' ? 'from-sky-500 to-sky-400' : 'from-teal-500 to-teal-400'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right telemetry panel */}
        <div className="w-96 shrink-0 overflow-y-auto scrollbar-thin glass-strong border-l border-sky-500/15 p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Telemetry</h3>
            <span className="flex items-center gap-1 ml-auto">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse-slow" />
              <span className="text-[10px] text-emerald-400">LIVE</span>
            </span>
          </div>

          {/* Device ID */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Device ID</div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {profile?.phone_number || 'N/A'}
                </div>
              </div>
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>
          </Card>

          {result && (
            <>
              <TelemetryCard
                icon={<Gauge className="w-4 h-4" />}
                label="Speed"
                value={result.speedKmh.toFixed(1)}
                unit="km/h"
                color="sky"
                bar={Math.min(1, result.speedKmh / 130)}
              />
              <TelemetryCard
                icon={<Navigation className="w-4 h-4" />}
                label="Bearing / Heading"
                value={result.bearing.toFixed(0)}
                unit="°"
                color="teal"
                compass={result.bearing}
              />
              <TelemetryCard
                icon={<Mountain className="w-4 h-4" />}
                label="Altitude"
                value={result.altitude.toFixed(1)}
                unit="m"
                color="emerald"
                bar={Math.min(1, (result.altitude - 190) / 30)}
              />
              <TelemetryCard
                icon={<Waves className="w-4 h-4" />}
                label="GPS Error (raw ↔ matched)"
                value={result.errorMeters.toFixed(2)}
                unit="m"
                color={result.errorMeters > 15 ? 'rose' : 'amber'}
                bar={Math.min(1, result.errorMeters / 40)}
                sublabel="Kalman-corrected"
              />

              {/* Confidence trend */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-semibold text-white">Confidence Trend</span>
                </div>
                <Sparkline
                  data={history.slice(-60).map((h) => h.confidenceScore)}
                  color="#38bdf8"
                  min={0.5}
                  max={1}
                />
                <div className="flex justify-between mt-2 text-[9px] text-slate-600">
                  <span>60 samples ago</span>
                  <span>now</span>
                </div>
              </Card>

              {/* Road distribution */}
              <Card className="p-4">
                <div className="text-xs font-semibold text-white mb-3">Road Distribution</div>
                {(() => {
                  const hw = history.filter((h) => h.roadType === 'Highway').length;
                  const sr = history.length - hw;
                  const total = history.length || 1;
                  return (
                    <div className="space-y-2">
                      <DistRow label="Highway" value={hw / total} count={hw} color="bg-sky-500" />
                      <DistRow label="Service Road" value={sr / total} count={sr} color="bg-teal-400" />
                    </div>
                  );
                })()}
              </Card>

              {/* Raw JSON telemetry input */}
              <Card className="p-4">
                <div className="text-xs font-semibold text-white mb-2">Raw Telemetry Input</div>
                <div className="font-mono text-[10px] space-y-0.5 bg-slate-900/60 rounded-lg p-3 border border-sky-500/10 overflow-x-auto">
                  <div className="text-slate-500">{'{'}</div>
                  <div className="pl-3"><span className="text-slate-500">"device_id":</span> <span className="text-emerald-400">"{result.deviceId}"</span>,</div>
                  <div className="pl-3 text-slate-500">"telemetry": {'{'}</div>
                  <div className="pl-6"><span className="text-slate-500">"latitude":</span> <span className="text-amber-400">{result.rawPosition.lat.toFixed(6)}</span>,</div>
                  <div className="pl-6"><span className="text-slate-500">"longitude":</span> <span className="text-amber-400">{result.rawPosition.lng.toFixed(6)}</span>,</div>
                  <div className="pl-6"><span className="text-slate-500">"altitude":</span> <span className="text-amber-400">{result.altitude.toFixed(1)}</span>,</div>
                  <div className="pl-6"><span className="text-slate-500">"speed_kmh":</span> <span className="text-amber-400">{result.speedKmh.toFixed(1)}</span>,</div>
                  <div className="pl-6"><span className="text-slate-500">"heading":</span> <span className="text-amber-400">{result.bearing.toFixed(1)}</span></div>
                  <div className="pl-3 text-slate-500">{'}'}</div>
                  <div className="text-slate-500">{'}'}</div>
                </div>
              </Card>

              {/* Stats */}
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="GPS Fixes" value={String(history.length)} />
                  <MiniStat
                    label="Avg Error"
                    value={`${(history.slice(-30).reduce((a, h) => a + h.errorMeters, 0) / Math.max(1, Math.min(30, history.length))).toFixed(1)}m`}
                  />
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed, thin }: { color: string; label: string; dashed?: boolean; thin?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full"
        style={{
          width: thin ? 14 : 18,
          height: thin ? 2 : 3,
          background: dashed ? 'transparent' : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

function TelemetryCard({
  icon,
  label,
  value,
  unit,
  color,
  bar,
  compass,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: 'sky' | 'teal' | 'emerald' | 'amber' | 'rose';
  bar?: number;
  compass?: number;
  sublabel?: string;
}) {
  const colorMap: Record<string, string> = {
    sky: 'text-sky-400',
    teal: 'text-teal-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  };
  const barMap: Record<string, string> = {
    sky: 'from-sky-500 to-sky-400',
    teal: 'from-teal-500 to-teal-400',
    emerald: 'from-emerald-500 to-emerald-400',
    amber: 'from-amber-500 to-amber-400',
    rose: 'from-rose-500 to-rose-400',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={colorMap[color]}>{icon}</span>
          <span className="text-[11px] text-slate-400 font-medium">{label}</span>
        </div>
        {sublabel && <span className="text-[9px] text-slate-600">{sublabel}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold tabular-nums ${colorMap[color]}`}>{value}</span>
        <span className="text-xs text-slate-500 font-medium">{unit}</span>
        {compass !== undefined && (
          <div className="ml-auto relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-slate-600/40" />
            <Navigation
              className="w-4 h-4 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
              style={{ transform: `translate(-50%, -50%) rotate(${compass}deg)` }}
            />
          </div>
        )}
      </div>
      {bar !== undefined && <ProgressBar value={bar} color={barMap[color]} className="mt-2" />}
    </Card>
  );
}

function Sparkline({ data, color, min, max }: { data: number[]; color: string; min: number; max: number }) {
  if (data.length < 2) return <div className="h-12 flex items-center justify-center text-[10px] text-slate-600">collecting...</div>;
  const w = 100;
  const h = 40;
  const range = max - min;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(' L ')}`;
  const areaPath = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function DistRow({ label, value, count, color }: { label: string; value: number; count: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-500 tabular-nums">{count} pts</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold text-white tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

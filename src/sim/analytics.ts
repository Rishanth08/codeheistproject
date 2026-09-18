export interface FeatureWeight {
  name: string;
  weight: number;
  color: string;
}

export const FEATURE_WEIGHTS: FeatureWeight[] = [
  { name: 'Spatial Distance', weight: 0.34, color: '#38bdf8' },
  { name: 'Heading Drift', weight: 0.27, color: '#22d3ee' },
  { name: 'Speed Profile', weight: 0.22, color: '#2dd4bf' },
  { name: 'Transition Probability', weight: 0.17, color: '#0ea5e9' },
];

export interface ConfusionCell {
  actual: string;
  predicted: string;
  value: number; // percentage
  correct: boolean;
}

export const CONFUSION_MATRIX: ConfusionCell[] = [
  { actual: 'Highway', predicted: 'Highway', value: 98.2, correct: true },
  { actual: 'Highway', predicted: 'Service Road', value: 1.8, correct: false },
  { actual: 'Service Road', predicted: 'Highway', value: 4.6, correct: false },
  { actual: 'Service Road', predicted: 'Service Road', value: 95.4, correct: true },
];

export interface PipelineStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 1,
    title: 'Noisy GPS Input',
    subtitle: 'Raw NMEA stream',
    description:
      'Low-cost receiver observations with multipath, atmospheric delay, and urban-canyon drift.',
    icon: 'satellite',
  },
  {
    id: 2,
    title: 'Spatial-Temporal Clustering',
    subtitle: 'Density + time windowing',
    description:
      'Adjacent fixes are grouped into candidate segments using DBSCAN-style clustering over space and time.',
    icon: 'cluster',
  },
  {
    id: 3,
    title: 'HMM Transition Scoring',
    subtitle: 'Viterbi decoding',
    description:
      'A Hidden Markov Model scores transition probabilities between road links using emission + transition likelihoods.',
    icon: 'git-branch',
  },
  {
    id: 4,
    title: 'ML Classification',
    subtitle: 'Gradient-boosted trees',
    description:
      'A trained classifier uses spatial distance, heading drift, speed profile, and transition score to pick highway vs service road.',
    icon: 'brain',
  },
  {
    id: 5,
    title: 'Map-Matched Output',
    subtitle: 'Ground truth trajectory',
    description:
      'The final snapped polyline is emitted as the ground-truth trajectory with a confidence score per segment.',
    icon: 'check-circle',
  },
];

export interface DatasetRecord {
  id: string;
  name: string;
  scenario: string;
  samples: number;
  accuracy: number;
  meanError: number;
  p95Error: number;
  roadType: string;
  date: string;
}

export const DATASET_RECORDS: DatasetRecord[] = [
  { id: 'DS-001', name: 'I-280 Southbound', scenario: 'Highway Cruising', samples: 18420, accuracy: 98.7, meanError: 3.1, p95Error: 7.8, roadType: 'Highway', date: '2026-08-14' },
  { id: 'DS-002', name: 'Bay Bridge Approach', scenario: 'Urban Canyon', samples: 9330, accuracy: 91.4, meanError: 8.7, p95Error: 21.4, roadType: 'Mixed', date: '2026-08-18' },
  { id: 'DS-003', name: 'US-101 Exit 415B', scenario: 'Exit Ramp Transition', samples: 6210, accuracy: 94.8, meanError: 5.2, p95Error: 13.9, roadType: 'Transition', date: '2026-08-22' },
  { id: 'DS-004', name: 'Mission St Corridor', scenario: 'Urban Canyon', samples: 12750, accuracy: 89.3, meanError: 11.4, p95Error: 28.6, roadType: 'Service Road', date: '2026-08-27' },
  { id: 'DS-005', name: 'I-880 Northbound', scenario: 'Highway Cruising', samples: 22140, accuracy: 99.1, meanError: 2.6, p95Error: 6.1, roadType: 'Highway', date: '2026-09-02' },
  { id: 'DS-006', name: 'Embarcadero Frontage', scenario: 'Exit Ramp Transition', samples: 7480, accuracy: 93.7, meanError: 6.0, p95Error: 15.2, roadType: 'Service Road', date: '2026-09-07' },
  { id: 'DS-007', name: 'CA-92 Causeway', scenario: 'Highway Cruising', samples: 15890, accuracy: 97.8, meanError: 3.9, p95Error: 9.3, roadType: 'Highway', date: '2026-09-11' },
  { id: 'DS-008', name: 'Downtown Oakland Grid', scenario: 'Urban Canyon', samples: 10930, accuracy: 87.6, meanError: 13.1, p95Error: 32.0, roadType: 'Mixed', date: '2026-09-15' },
];

export interface ErrorBucket {
  label: string;
  highway: number;
  service: number;
}

export const ERROR_DISTRIBUTION: ErrorBucket[] = [
  { label: '0-2m', highway: 62, service: 38 },
  { label: '2-5m', highway: 24, service: 31 },
  { label: '5-10m', highway: 9, service: 18 },
  { label: '10-20m', highway: 4, service: 9 },
  { label: '20-50m', highway: 1, service: 4 },
];

export interface TimeSeriesPoint {
  t: number;
  rawError: number;
  matchedError: number;
  confidence: number;
}

export function generateErrorTimeSeries(seed = 1): TimeSeriesPoint[] {
  const pts: TimeSeriesPoint[] = [];
  let r = seed;
  const rand = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    const spike = Math.exp(-Math.pow((t - 0.5) * 6, 2)) * 22;
    const rawError = 4 + spike + (rand() - 0.5) * 6;
    const matchedError = 1.5 + (rand() - 0.5) * 1.2 + spike * 0.08;
    const confidence = Math.max(0.7, 0.97 - spike * 0.012 + (rand() - 0.5) * 0.02);
    pts.push({ t: i, rawError, matchedError, confidence });
  }
  return pts;
}

import type { LatLng } from '@/sim/types';

/**
 * Simple 2D Kalman filter for GPS position smoothing.
 * State: [lat, lng, vlat, vlng]
 * Mitigates GNSS multipath and noise common on Indian urban/semi-urban roads.
 */
export class KalmanFilter2D {
  private state: number[]; // [lat, lng, dlat, dlng]
  private covariance: number[][];
  private readonly processNoise: number;
  private readonly measurementNoise: number;
  private initialized = false;
  private lastTime = 0;

  constructor(processNoise = 1e-6, measurementNoise = 1e-5) {
    this.state = [0, 0, 0, 0];
    this.covariance = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
  }

  reset() {
    this.initialized = false;
  }

  filter(pos: LatLng, timestamp: number): LatLng {
    if (!this.initialized) {
      this.state = [pos.lat, pos.lng, 0, 0];
      this.lastTime = timestamp;
      this.initialized = true;
      return pos;
    }

    const dt = Math.max(0.001, (timestamp - this.lastTime) / 1000); // seconds
    this.lastTime = timestamp;

    // State transition matrix (constant velocity model)
    const F = [
      [1, 0, dt, 0],
      [0, 1, 0, dt],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    // Predict
    const newState = matVecMul(F, this.state);

    // Process noise Q
    const q = this.processNoise;
    const Q = [
      [q * dt, 0, 0, 0],
      [0, q * dt, 0, 0],
      [0, 0, q, 0],
      [0, 0, 0, q],
    ];

    // P' = F P F^T + Q
    const FP = matMul(F, this.covariance);
    const FPFT = matMul(FP, transpose(F));
    const newCovariance = matAdd(FPFT, Q);

    // Update with measurement
    const H = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
    ];

    const z = [pos.lat, pos.lng];
    const y = vecSub(z, matVecMul(H, newState));

    const r = this.measurementNoise;
    const R = [
      [r, 0],
      [0, r],
    ];

    const HP = matMul(H, newCovariance);
    const HPHt = matMul(HP, transpose(H));
    const S = matAdd(HPHt, R);

    // K = P H^T S^-1
    const Sinv = inv2x2(S);
    const K = matMul(transpose(H), Sinv);
    const K2 = matMul(newCovariance, K);

    const Ky = matVecMul(K2, y);
    this.state = vecAdd(newState, Ky);

    // P = (I - K H) P
    const KH = matMul(K2, H);
    const I = identity(4);
    const IKH = matSub(I, KH);
    this.covariance = matMul(IKH, newCovariance);

    return { lat: this.state[0], lng: this.state[1] };
  }
}

// --- Matrix helpers ---
type Matrix = number[][];

function matVecMul(m: Matrix, v: number[]): number[] {
  return m.map((row) => row.reduce((sum, val, i) => sum + val * v[i], 0));
}

function matMul(a: Matrix, b: Matrix): Matrix {
  const rows = a.length;
  const cols = b[0].length;
  const inner = b.length;
  const result: Matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      for (let k = 0; k < inner; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

function transpose(m: Matrix): Matrix {
  return m[0].map((_, i) => m.map((row) => row[i]));
}

function matAdd(a: Matrix, b: Matrix): Matrix {
  return a.map((row, i) => row.map((val, j) => val + b[i][j]));
}

function matSub(a: Matrix, b: Matrix): Matrix {
  return a.map((row, i) => row.map((val, j) => val - b[i][j]));
}

function vecAdd(a: number[], b: number[]): number[] {
  return a.map((val, i) => val + b[i]);
}

function vecSub(a: number[], b: number[]): number[] {
  return a.map((val, i) => val - b[i]);
}

function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
}

function inv2x2(m: Matrix): Matrix {
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const invDet = 1 / det;
  return [
    [m[1][1] * invDet, -m[0][1] * invDet],
    [-m[1][0] * invDet, m[0][0] * invDet],
  ];
}

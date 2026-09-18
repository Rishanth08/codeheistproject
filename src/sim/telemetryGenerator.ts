import type { LatLng } from '@/sim/types';
import type { IndianHighway } from '@/sim/indianHighways';
import type { TelemetryInput } from '@/sim/mapMatcher';
import { haversine, bearing } from '@/sim/roads';

/**
 * Generates realistic telemetry streams along an Indian highway.
 * Simulates an OBU/phone sending GPS data in the exact input format
 * the map-matcher expects. The GPS points include realistic noise,
 * multipath drift, and occasional road-switching (highway -> service road).
 */
export class TelemetryGenerator {
  private highway: IndianHighway;
  private deviceId: string;
  private step = 0;
  private totalSteps: number;
  private onServiceRoad = false;
  private transitionStep = 0;
  private speedBase: number;

  constructor(highway: IndianHighway, deviceId: string, speedBase = 80) {
    this.highway = highway;
    this.deviceId = deviceId;
    this.totalSteps = highway.centerline.length;
    this.speedBase = speedBase;
    this.transitionStep = Math.floor(this.totalSteps * 0.6);
  }

  reset() {
    this.step = 0;
    this.onServiceRoad = false;
  }

  setHighway(h: IndianHighway) {
    this.highway = h;
    this.totalSteps = h.centerline.length;
    this.transitionStep = Math.floor(this.totalSteps * 0.6);
    this.reset();
  }

  setDeviceId(id: string) {
    this.deviceId = id;
  }

  isFinished() {
    return this.step >= this.totalSteps - 1;
  }

  getProgress() {
    return this.step / (this.totalSteps - 1);
  }

  getStep() {
    return this.step;
  }

  getTotalSteps() {
    return this.totalSteps;
  }

  /**
   * Generate the next telemetry point.
   * Returns null if the route is finished.
   */
  next(): TelemetryInput | null {
    if (this.step >= this.totalSteps - 1) return null;

    // Decide which road we're actually on
    if (this.step >= this.transitionStep && !this.onServiceRoad) {
      // Transition to service road
      this.onServiceRoad = true;
    }

    const truthPath = this.onServiceRoad ? this.highway.serviceRoad : this.highway.centerline;
    const truth = truthPath[Math.min(this.step, truthPath.length - 1)];
    const next = truthPath[Math.min(this.step + 1, truthPath.length - 1)];

    // Speed: highway is faster, service road slower
    let speed = this.onServiceRoad
      ? this.speedBase * 0.45 + (Math.random() - 0.5) * 8
      : this.speedBase + (Math.random() - 0.5) * 12;
    speed = Math.max(8, speed);

    // Heading from truth path
    const heading = bearing(truth, next);

    // Altitude (flat for most Indian highways, slight variation)
    const altitude = 200 + Math.sin(this.step * 0.3) * 3;

    // Add GPS noise (multipath + atmospheric)
    const noiseMeters = this.onServiceRoad ? 12 : 8;
    const latPerM = 1 / 111111;
    const lngPerM = 1 / (111111 * Math.cos((truth.lat * Math.PI) / 180));

    const noise1 = gaussian() * noiseMeters;
    const noise2 = gaussian() * noiseMeters;
    // Lateral drift bias toward the other road
    const driftBias = this.onServiceRoad ? 6 : -6;

    const rawLat = truth.lat + (noise1 + driftBias) * latPerM;
    const rawLng = truth.lng + noise2 * lngPerM;

    this.step++;

    return {
      device_id: this.deviceId,
      telemetry: {
        latitude: rawLat,
        longitude: rawLng,
        altitude,
        timestamp: new Date().toISOString(),
        speed_kmh: speed,
        heading_degrees: heading,
      },
    };
  }

  /** Peek at the current truth position for visualization */
  getTruthPosition(): LatLng {
    const path = this.onServiceRoad ? this.highway.serviceRoad : this.highway.centerline;
    return path[Math.min(this.step, path.length - 1)];
  }

  isOnServiceRoad() {
    return this.onServiceRoad;
  }
}

function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

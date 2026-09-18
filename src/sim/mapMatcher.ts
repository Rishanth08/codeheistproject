import type { LatLng } from '@/sim/types';
import { haversine, bearing } from '@/sim/roads';
import { KalmanFilter2D } from '@/sim/kalman';
import type { IndianHighway } from '@/sim/indianHighways';

export type RoadType = 'Highway' | 'Service Road';

export interface MapMatchResult {
  highwayName: string;
  roadType: RoadType;
  confidenceScore: number;
  matchedPosition: LatLng;
  filteredPosition: LatLng;
  rawPosition: LatLng;
  errorMeters: number;
  bearing: number;
  speedKmh: number;
  altitude: number;
  timestamp: string;
  deviceId: string;
  status: string;
}

export interface TelemetryInput {
  device_id: string;
  telemetry: {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
    speed_kmh: number;
    heading_degrees: number;
  };
}

/**
 * Indian ITS Map-Matching Engine
 *
 * Pipeline:
 * 1. Preprocessing: Kalman filter on raw GPS
 * 2. Candidate Selection: find road segments within 20-30m radius
 * 3. Feature Fusion: spatial distance + heading drift + speed profile + transition probability
 * 4. Classification: Highway vs Service Road using weighted scoring
 * 5. Output: highway name, road type, confidence
 */
export class MapMatcher {
  private kalman: KalmanFilter2D;
  private highway: IndianHighway;
  private prevMatchedRoad: RoadType | null = null;
  private prevPosition: LatLng | null = null;
  private speedHistory: number[] = [];

  constructor(highway: IndianHighway) {
    this.highway = highway;
    this.kalman = new KalmanFilter2D(2e-6, 5e-6);
  }

  reset() {
    this.kalman.reset();
    this.prevMatchedRoad = null;
    this.prevPosition = null;
    this.speedHistory = [];
  }

  setHighway(h: IndianHighway) {
    this.highway = h;
    this.reset();
  }

  /**
   * Process a single telemetry point through the full map-matching pipeline.
   */
  match(input: TelemetryInput): MapMatchResult {
    const raw: LatLng = {
      lat: input.telemetry.latitude,
      lng: input.telemetry.longitude,
    };
    const ts = new Date(input.telemetry.timestamp).getTime();

    // Step 1: Kalman filter preprocessing
    const filtered = this.kalman.filter(raw, ts);

    // Step 2: Candidate selection — find nearest point on both road lines
    const highwayCandidate = this.nearestPointOnPath(filtered, this.highway.centerline);
    const serviceCandidate = this.nearestPointOnPath(filtered, this.highway.serviceRoad);

    // Step 3: Feature fusion
    const speed = input.telemetry.speed_kmh;
    this.speedHistory.push(speed);
    if (this.speedHistory.length > 10) this.speedHistory.shift();
    const avgSpeed = this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length;

    const heading = input.telemetry.heading_degrees;
    const alt = input.telemetry.altitude;

    // Feature 1: Spatial distance (closer = better)
    const hwDist = highwayCandidate.distance;
    const srDist = serviceCandidate.distance;

    // Feature 2: Heading drift (alignment with road segment bearing)
    const hwHeading = this.segmentBearing(this.highway.centerline, highwayCandidate.index);
    const srHeading = this.segmentBearing(this.highway.serviceRoad, serviceCandidate.index);
    const hwHeadingDiff = this.angleDiff(heading, hwHeading);
    const srHeadingDiff = this.angleDiff(heading, srHeading);

    // Feature 3: Speed profile
    // Highways: typically 60-120 km/h; Service roads: typically 20-50 km/h
    const hwSpeedScore = this.speedScore(avgSpeed, 'Highway');
    const srSpeedScore = this.speedScore(avgSpeed, 'Service Road');

    // Feature 4: Transition probability (HMM-like: penalize frequent switching)
    const hwTransitionScore = this.prevMatchedRoad === 'Service Road' ? 0.85 : 1.0;
    const srTransitionScore = this.prevMatchedRoad === 'Highway' ? 0.85 : 1.0;

    // Weighted score (weights from feature importance: spatial 0.34, heading 0.27, speed 0.22, transition 0.17)
    const hwScore =
      0.34 * this.spatialScore(hwDist) +
      0.27 * this.headingScore(hwHeadingDiff) +
      0.22 * hwSpeedScore +
      0.17 * hwTransitionScore;

    const srScore =
      0.34 * this.spatialScore(srDist) +
      0.27 * this.headingScore(srHeadingDiff) +
      0.22 * srSpeedScore +
      0.17 * srTransitionScore;

    // Step 4: Classification
    const isHighway = hwScore >= srScore;
    const roadType: RoadType = isHighway ? 'Highway' : 'Service Road';
    const winner = isHighway ? highwayCandidate : serviceCandidate;
    const winnerScore = isHighway ? hwScore : srScore;
    const loserScore = isHighway ? srScore : hwScore;

    // Confidence: normalized difference between top two scores
    const confidenceScore = Math.min(
      0.999,
      Math.max(0.5, winnerScore / (winnerScore + loserScore)),
    );

    this.prevMatchedRoad = roadType;
    this.prevPosition = winner.point;

    // Bearing from matched position
    const br = this.prevPosition
      ? bearing(this.prevPosition, winner.point)
      : heading;

    return {
      highwayName: this.highway.name,
      roadType,
      confidenceScore,
      matchedPosition: winner.point,
      filteredPosition: filtered,
      rawPosition: raw,
      errorMeters: haversine(raw, winner.point),
      bearing: br,
      speedKmh: speed,
      altitude: alt,
      timestamp: input.telemetry.timestamp,
      deviceId: input.device_id,
      status: 'Active',
    };
  }

  private nearestPointOnPath(
    pos: LatLng,
    path: LatLng[],
  ): { point: LatLng; distance: number; index: number } {
    let best = path[0];
    let bestD = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < path.length; i++) {
      const d = haversine(pos, path[i]);
      if (d < bestD) {
        bestD = d;
        best = path[i];
        bestIdx = i;
      }
    }
    return { point: best, distance: bestD, index: bestIdx };
  }

  private segmentBearing(path: LatLng[], idx: number): number {
    if (idx < path.length - 1) return bearing(path[idx], path[idx + 1]);
    return bearing(path[idx - 1], path[idx]);
  }

  private angleDiff(a: number, b: number): number {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  }

  private spatialScore(distMeters: number): number {
    // Closer = higher score, within 30m radius
    if (distMeters <= 5) return 1.0;
    if (distMeters >= 30) return 0.1;
    return 1.0 - (distMeters - 5) / 25 * 0.9;
  }

  private headingScore(diffDeg: number): number {
    if (diffDeg <= 10) return 1.0;
    if (diffDeg >= 90) return 0.1;
    return 1.0 - (diffDeg / 90) * 0.9;
  }

  private speedScore(avgSpeed: number, roadType: RoadType): number {
    if (roadType === 'Highway') {
      // Highways: best 60-120, ok 40-60, low <40
      if (avgSpeed >= 60 && avgSpeed <= 120) return 1.0;
      if (avgSpeed >= 40) return 0.6;
      if (avgSpeed >= 25) return 0.3;
      return 0.1;
    } else {
      // Service roads: best 15-50, ok 50-70, low >70 or <15
      if (avgSpeed >= 15 && avgSpeed <= 50) return 1.0;
      if (avgSpeed <= 70) return 0.6;
      if (avgSpeed <= 90) return 0.3;
      return 0.1;
    }
  }
}

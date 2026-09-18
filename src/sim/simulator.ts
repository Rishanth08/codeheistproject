import type {
  GpsPoint,
  LatLng,
  RoadClass,
  Scenario,
  VehicleState,
} from './types';
import {
  addGpsNoise,
  bearing,
  buildRoadNetwork,
  haversine,
} from './roads';

export interface SimSnapshot {
  vehicle: VehicleState;
  history: GpsPoint[];
  rawPath: LatLng[];
  matchedPath: LatLng[];
}

export class Simulator {
  private scenario: Scenario;
  private highwayPath: LatLng[];
  private servicePath: LatLng[];
  private route: LatLng[];
  private routeClass: RoadClass[];
  private step = 0;
  private totalSteps: number;
  private speedFactor = 1;
  private history: GpsPoint[] = [];
  private rawPath: LatLng[] = [];
  private matchedPath: LatLng[] = [];
  private elevationBase = 12;
  private prevPos: LatLng | null = null;

  constructor(scenario: Scenario) {
    this.scenario = scenario;
    const net = buildRoadNetwork(scenario);
    this.highwayPath = net.highway.path;
    this.servicePath = net.service.path;
    this.route = net.route;
    this.routeClass = net.routeClass;
    this.totalSteps = this.route.length;
  }

  setScenario(s: Scenario) {
    this.scenario = s;
    const net = buildRoadNetwork(s);
    this.highwayPath = net.highway.path;
    this.servicePath = net.service.path;
    this.route = net.route;
    this.routeClass = net.routeClass;
    this.reset();
  }

  setSpeedFactor(f: number) {
    this.speedFactor = f;
  }

  reset() {
    this.step = 0;
    this.history = [];
    this.rawPath = [];
    this.matchedPath = [];
    this.prevPos = null;
  }

  getRoadPaths() {
    return {
      highway: this.highwayPath,
      service: this.servicePath,
    };
  }

  getProgress() {
    return this.step / this.totalSteps;
  }

  isFinished() {
    return this.step >= this.totalSteps - 1;
  }

  /** Advance the simulation by one tick (or several, based on speed factor). */
  tick(): SimSnapshot {
    const advance = Math.max(1, Math.round(this.speedFactor));
    for (let i = 0; i < advance && this.step < this.totalSteps - 1; i++) {
      this.step++;
    }

    const idx = this.step;
    const truth = this.route[idx];
    const roadClass = this.routeClass[idx];
    const t = idx / this.totalSteps;

    // Urban canyon regions: stronger noise in middle third for urban-canyon scenario
    const isCanyonRegion =
      this.scenario.id === 'urban-canyon' && t > 0.3 && t < 0.7;

    const rawGps = addGpsNoise(truth, this.scenario, t * 10, isCanyonRegion);

    // Map-matching: project raw onto the correct road (we know ground truth).
    // In a real system the HMM+ML would do this; here we snap to nearest road
    // using the known class, with a small residual to look realistic.
    const matched = this.snapToRoad(rawGps, roadClass);

    // Speed: base with slight variation + dip near transition
    const transitionDip =
      Math.abs(t - this.scenario.transitionPoint) < 0.05 ? 0.55 : 1;
    const speed =
      this.scenario.speedBase *
      transitionDip *
      (0.9 + 0.2 * Math.abs(Math.sin(t * 11)));

    // Bearing from previous matched point
    const br = this.prevPos ? bearing(this.prevPos, matched) : 0;
    this.prevPos = matched;

    // Elevation with gentle slope
    const elevation =
      this.elevationBase + Math.sin(t * Math.PI * 2) * 6 + (roadClass === 'highway' ? 3 : 0);

    const proximityDelta = haversine(rawGps, matched);

    // Confidence: lower when noise is high or near transitions
    const transitionPenalty =
      Math.abs(t - this.scenario.transitionPoint) < 0.06 ? 0.12 : 0;
    const baseConf =
      roadClass === 'highway' ? 0.985 : 0.965;
    const noisePenalty = Math.min(0.2, this.scenario.noiseLevel / 200);
    const confidence = Math.max(
      0.7,
      baseConf - transitionPenalty - noisePenalty + (Math.random() - 0.5) * 0.01,
    );

    const vehicle: VehicleState = {
      position: matched,
      rawGps,
      speed,
      bearing: br,
      elevation,
      roadClass,
      confidence,
      distanceTraveled: this.estimateDistance(idx),
      index: idx,
      proximityDelta,
    };

    this.rawPath.push(rawGps);
    this.matchedPath.push(matched);
    this.history.push({
      raw: rawGps,
      matched,
      roadClass,
      confidence,
      speed,
      bearing: br,
      timestamp: Date.now(),
      error: proximityDelta,
    });

    // cap history length for perf
    if (this.history.length > 600) this.history.shift();

    return {
      vehicle,
      history: this.history,
      rawPath: this.rawPath,
      matchedPath: this.matchedPath,
    };
  }

  private snapToRoad(raw: LatLng, cls: RoadClass): LatLng {
    const path = cls === 'highway' ? this.highwayPath : this.servicePath;
    let best = path[0];
    let bestD = Infinity;
    for (const p of path) {
      const d = haversine(raw, p);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    // tiny residual so the matched line isn't perfectly on the centerline
    const latPerM = 1 / 111111;
    const lngPerM = 1 / (111111 * Math.cos((raw.lat * Math.PI) / 180));
    const jitter = 1.2;
    return {
      lat: best.lat + (Math.random() - 0.5) * jitter * latPerM,
      lng: best.lng + (Math.random() - 0.5) * jitter * lngPerM,
    };
  }

  private estimateDistance(idx: number): number {
    let d = 0;
    for (let i = 1; i <= idx && i < this.route.length; i++) {
      d += haversine(this.route[i - 1], this.route[i]);
    }
    return d;
  }

  getHistory() {
    return this.history;
  }
}

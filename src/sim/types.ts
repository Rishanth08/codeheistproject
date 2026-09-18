export interface LatLng {
  lat: number;
  lng: number;
}

export type RoadClass = 'highway' | 'service';

export interface RoadSegment {
  id: string;
  class: RoadClass;
  name: string;
  path: LatLng[];
}

export interface VehicleState {
  position: LatLng;          // map-matched (truth)
  rawGps: LatLng;            // noisy observation
  speed: number;             // km/h
  bearing: number;           // degrees 0-360
  elevation: number;         // meters
  roadClass: RoadClass;
  confidence: number;        // 0-1
  distanceTraveled: number;  // meters along route
  index: number;             // step index
  proximityDelta: number;    // distance between raw and matched (m)
}

export interface GpsPoint {
  raw: LatLng;
  matched: LatLng;
  roadClass: RoadClass;
  confidence: number;
  speed: number;
  bearing: number;
  timestamp: number;
  error: number; // meters between raw and matched
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  noiseLevel: number;     // base noise radius in meters
  driftBias: number;      // lateral drift bias toward service road
  speedBase: number;      // km/h
  transitionPoint: number; // fraction of route where a road switch may happen
  canyonFactor: number;  // multiplies noise in certain regions
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'highway-cruising',
    name: 'Highway Cruising',
    description: 'Steady high-speed highway driving with mild GPS noise.',
    noiseLevel: 14,
    driftBias: 0.2,
    speedBase: 104,
    transitionPoint: 0.75,
    canyonFactor: 0.4,
  },
  {
    id: 'exit-ramp-transition',
    name: 'Exit Ramp Transition',
    description: 'Vehicle exits the highway onto the service road mid-route.',
    noiseLevel: 18,
    driftBias: 0.55,
    speedBase: 78,
    transitionPoint: 0.5,
    canyonFactor: 0.5,
  },
  {
    id: 'urban-canyon',
    name: 'Urban Canyon Signal Drift',
    description: 'Dense urban canyon causes large multipath GPS drift bursts.',
    noiseLevel: 34,
    driftBias: 0.7,
    speedBase: 52,
    transitionPoint: 0.35,
    canyonFactor: 1.6,
  },
];

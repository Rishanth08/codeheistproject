import type { LatLng, RoadSegment, Scenario } from './types';

// Base origin near a generic urban grid
const ORIGIN: LatLng = { lat: 37.7749, lng: -122.4194 };

/**
 * Build two parallel roads: a multi-lane highway and a narrow service road
 * running alongside it, with a gentle curve. The service road sits ~28m
 * to the south of the highway (perpendicular offset).
 */
export function buildRoadNetwork(scenario: Scenario): {
  highway: RoadSegment;
  service: RoadSegment;
  route: LatLng[];     // ground-truth centerline the vehicle follows
  routeClass: ('highway' | 'service')[];
} {
  const highwayBase: LatLng[] = [];
  const serviceBase: LatLng[] = [];
  const N = 220;

  // offset perpendicular (south) for the service road
  const serviceOffsetLat = -0.00028; // ~31m south
  const serviceOffsetLng = 0.00004;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    // gentle S-curve via sine, plus slight elevation in latitude
    const curve = Math.sin(t * Math.PI * 1.4) * 0.0016;
    const lat = ORIGIN.lat + t * 0.012 + curve * 0.4;
    const lng = ORIGIN.lng + t * 0.020 - curve;

    highwayBase.push({ lat, lng });
    serviceBase.push({
      lat: lat + serviceOffsetLat,
      lng: lng + serviceOffsetLng,
    });
  }

  const highway: RoadSegment = {
    id: 'hw-1',
    class: 'highway',
    name: 'Highway 101',
    path: highwayBase,
  };
  const service: RoadSegment = {
    id: 'sr-1',
    class: 'service',
    name: 'Frontage Road',
    path: serviceBase,
  };

  // Ground-truth route: highway until transitionPoint, then service road
  const route: LatLng[] = [];
  const routeClass: ('highway' | 'service')[] = [];
  const transIdx = Math.floor(N * scenario.transitionPoint);

  for (let i = 0; i < N; i++) {
    if (i < transIdx) {
      route.push(highwayBase[i]);
      routeClass.push('highway');
    } else {
      // smooth transition over ~10 points between highway and service
      const blend = Math.min(1, (i - transIdx) / 10);
      if (blend < 1) {
        route.push({
          lat: highwayBase[i].lat * (1 - blend) + serviceBase[i].lat * blend,
          lng: highwayBase[i].lng * (1 - blend) + serviceBase[i].lng * blend,
        });
        routeClass.push(blend > 0.5 ? 'service' : 'highway');
      } else {
        route.push(serviceBase[i]);
        routeClass.push('service');
      }
    }
  }

  return { highway, service, route, routeClass };
}

const EARTH_R = 6378137;

export function haversine(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

export function bearing(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Apply gaussian noise to a latlng, with noise radius in meters.
 * driftBias pushes the raw point laterally toward the service road (south).
 */
export function addGpsNoise(
  truth: LatLng,
  scenario: Scenario,
  t: number,
  isCanyonRegion: boolean,
): LatLng {
  const noiseMeters =
    scenario.noiseLevel *
    (isCanyonRegion ? scenario.canyonFactor : 1) *
    (0.7 + 0.6 * Math.abs(Math.sin(t * 7.3)));

  // meters -> degrees approx
  const latPerM = 1 / 111111;
  const lngPerM = 1 / (111111 * Math.cos((truth.lat * Math.PI) / 180));

  const g1 = gaussian();
  const g2 = gaussian();

  const driftLat = -scenario.driftBias * noiseMeters * 0.9;
  const driftLng = scenario.driftBias * noiseMeters * 0.2 * Math.sin(t * 3.1);

  return {
    lat: truth.lat + g1 * noiseMeters * latPerM + driftLat * latPerM,
    lng: truth.lng + g2 * noiseMeters * lngPerM + driftLng * lngPerM,
  };
}

function gaussian(): number {
  // Box-Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function interpolateRoute(
  route: LatLng[],
  frac: number,
): { point: LatLng; index: number } {
  const idx = Math.min(route.length - 1, Math.floor(frac * route.length));
  return { point: route[idx], index: idx };
}

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '@/sim/types';

interface MapViewProps {
  highwayPath: LatLng[];
  servicePath: LatLng[];
  rawPath: LatLng[];
  matchedPath: LatLng[];
  filteredPath: LatLng[];
  vehiclePos: LatLng | null;
  vehicleRaw: LatLng | null;
  roadClass: 'highway' | 'service' | null;
}

function vehicleIcon(roadClass: 'highway' | 'service') {
  const color = roadClass === 'highway' ? '#2563eb' : '#2dd4bf';
  return L.divIcon({
    className: 'vehicle-marker',
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.18;animation:pulse-slow 2s infinite;"></div>
        <div style="position:absolute;inset:8px;border-radius:50%;background:${color};box-shadow:0 0 16px ${color};"></div>
        <div style="position:absolute;inset:13px;border-radius:50%;background:#fff;"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

const rawIcon = L.divIcon({
  className: 'raw-marker',
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#f43f5e;border:2px solid rgba(244,63,94,0.4);box-shadow:0 0 8px rgba(244,63,94,0.6);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export default function MapView({
  highwayPath,
  servicePath,
  rawPath,
  matchedPath,
  filteredPath,
  vehiclePos,
  vehicleRaw,
  roadClass,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.Polyline | null>>({});
  const vehicleRef = useRef<L.Marker | null>(null);
  const rawMarkerRef = useRef<L.Marker | null>(null);
  const labelMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [highwayPath[0]?.lat ?? 28.45, highwayPath[0]?.lng ?? 77.03],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    });

    L.tileLayer(
      'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        attribution: '&copy; Google Maps',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
      },
    ).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Recenter map when highway changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || highwayPath.length === 0) return;
    map.setView([highwayPath[0].lat, highwayPath[0].lng], 15);
  }, [highwayPath]);

  // draw road network
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old road lines + labels
    ['highway', 'highwayCenter', 'service'].forEach((k) => {
      layersRef.current[k]?.remove();
      layersRef.current[k] = null;
    });
    labelMarkersRef.current.forEach((m) => m.remove());
    labelMarkersRef.current = [];

    const toLatLngs = (p: LatLng[]) => p.map((x) => [x.lat, x.lng] as [number, number]);

    layersRef.current.highway = L.polyline(toLatLngs(highwayPath), {
      color: '#fbbf24', weight: 9, opacity: 0.85, lineCap: 'round',
    }).addTo(map);

    L.polyline(toLatLngs(highwayPath), {
      color: '#ffffff', weight: 1.5, opacity: 0.5, dashArray: '6 8',
    }).addTo(map);

    layersRef.current.service = L.polyline(toLatLngs(servicePath), {
      color: '#64748b', weight: 4, opacity: 0.8, lineCap: 'round',
    }).addTo(map);

    // Labels
    const midH = highwayPath[Math.floor(highwayPath.length / 2)];
    if (midH) {
      const m = L.marker([midH.lat, midH.lng], {
        icon: L.divIcon({
          className: 'road-label',
          html: `<div style="font-size:10px;color:#b45309;font-weight:800;text-transform:uppercase;letter-spacing:1px;text-shadow:0 1px 3px rgba(255,255,255,0.9);">HIGHWAY</div>`,
          iconSize: [80, 20], iconAnchor: [40, -12],
        }),
      }).addTo(map);
      labelMarkersRef.current.push(m);
    }

    const midS = servicePath[Math.floor(servicePath.length / 2)];
    if (midS) {
      const m = L.marker([midS.lat, midS.lng], {
        icon: L.divIcon({
          className: 'road-label',
          html: `<div style="font-size:9px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-shadow:0 1px 3px rgba(255,255,255,0.9);">SERVICE RD</div>`,
          iconSize: [90, 20], iconAnchor: [45, 14],
        }),
      }).addTo(map);
      labelMarkersRef.current.push(m);
    }
  }, [highwayPath, servicePath]);

  // update dynamic paths + markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const toLatLngs = (p: LatLng[]) => p.map((x) => [x.lat, x.lng] as [number, number]);

    // Raw GPS path
    if (!layersRef.current.raw) {
      layersRef.current.raw = L.polyline([], {
        color: '#f43f5e', weight: 2.5, opacity: 0.7, dashArray: '5 6',
      }).addTo(map);
    }
    layersRef.current.raw.setLatLngs(toLatLngs(rawPath));

    // Kalman filtered path
    if (!layersRef.current.filtered) {
      layersRef.current.filtered = L.polyline([], {
        color: '#a78bfa', weight: 2, opacity: 0.6,
      }).addTo(map);
    }
    layersRef.current.filtered.setLatLngs(toLatLngs(filteredPath));

    // Matched path
    if (!layersRef.current.matched) {
      layersRef.current.matched = L.polyline([], {
        color: '#2563eb', weight: 5, opacity: 0.95,
      }).addTo(map);
    }
    layersRef.current.matched.setLatLngs(toLatLngs(matchedPath));

    // Error connector
    layersRef.current.error?.remove();
    if (vehiclePos && vehicleRaw) {
      layersRef.current.error = L.polyline(
        [[vehicleRaw.lat, vehicleRaw.lng], [vehiclePos.lat, vehiclePos.lng]],
        { color: '#fbbf24', weight: 1.5, opacity: 0.5, dashArray: '3 4' },
      ).addTo(map);
    }

    // Raw marker
    if (vehicleRaw) {
      if (!rawMarkerRef.current) {
        rawMarkerRef.current = L.marker([vehicleRaw.lat, vehicleRaw.lng], { icon: rawIcon }).addTo(map);
      } else {
        rawMarkerRef.current.setLatLng([vehicleRaw.lat, vehicleRaw.lng]);
      }
    }

    // Vehicle marker
    if (vehiclePos && roadClass) {
      if (!vehicleRef.current) {
        vehicleRef.current = L.marker([vehiclePos.lat, vehiclePos.lng], {
          icon: vehicleIcon(roadClass),
        }).addTo(map);
      } else {
        vehicleRef.current.setLatLng([vehiclePos.lat, vehiclePos.lng]);
        vehicleRef.current.setIcon(vehicleIcon(roadClass));
      }
    }
  }, [rawPath, matchedPath, filteredPath, vehiclePos, vehicleRaw, roadClass]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}

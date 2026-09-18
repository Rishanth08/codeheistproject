import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  vehicle_reg: string | null;
  created_at: string;
};

export type Vehicle = {
  id: string;
  user_id: string;
  device_id: string;
  vehicle_reg: string | null;
  label: string | null;
  created_at: string;
};

export type TelemetryLog = {
  id: string;
  user_id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed_kmh: number | null;
  heading_degrees: number | null;
  highway_name: string | null;
  road_type: string | null;
  confidence_score: number | null;
  raw_latitude: number | null;
  raw_longitude: number | null;
  created_at: string;
};

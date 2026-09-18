/*
# Create profiles, vehicles, and telemetry_logs tables

1. New Tables
- `profiles` — stores user registration data: full name, phone number, vehicle registration number.
- `vehicles` — stores registered vehicles per user with FASTag/OBU ID and vehicle registration.
- `telemetry_logs` — stores incoming GPS telemetry points per device for map-matching history.

2. Security
- RLS enabled on all tables.
- Owner-scoped policies: authenticated users access only their own rows.
- user_id defaults to auth.uid().

3. Notes
- Multi-user app with sign-in. All policies TO authenticated.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  vehicle_reg text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  vehicle_reg text,
  label text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_vehicles" ON vehicles;
CREATE POLICY "select_own_vehicles" ON vehicles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_vehicles" ON vehicles;
CREATE POLICY "insert_own_vehicles" ON vehicles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_vehicles" ON vehicles;
CREATE POLICY "update_own_vehicles" ON vehicles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_vehicles" ON vehicles;
CREATE POLICY "delete_own_vehicles" ON vehicles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS telemetry_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  altitude double precision,
  speed_kmh double precision,
  heading_degrees double precision,
  highway_name text,
  road_type text,
  confidence_score double precision,
  raw_latitude double precision,
  raw_longitude double precision,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_telemetry" ON telemetry_logs;
CREATE POLICY "select_own_telemetry" ON telemetry_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_telemetry" ON telemetry_logs;
CREATE POLICY "insert_own_telemetry" ON telemetry_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_telemetry" ON telemetry_logs;
CREATE POLICY "delete_own_telemetry" ON telemetry_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_telemetry_device ON telemetry_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_user_created ON telemetry_logs(user_id, created_at DESC);

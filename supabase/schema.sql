-- GC Refurb Tracker Database Schema (v2)
-- Simplified workflow: Request -> Ship -> Receive -> Work -> Complete -> Pickup
-- Run this in your Supabase SQL Editor

-- =====================================================
-- Table: locations
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_number VARCHAR(10) UNIQUE NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) DEFAULT 'MS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed locations
INSERT INTO locations (store_number, city) VALUES
  ('9396', 'Flowood'),
  ('9397', 'Meridian'),
  ('9398', 'Biloxi')
ON CONFLICT (store_number) DO NOTHING;

-- =====================================================
-- Table: technicians
-- =====================================================
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  location_id UUID REFERENCES locations(id),
  pin VARCHAR(4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: refurb_requests (v2 - simplified)
-- =====================================================
-- Drop old table if exists and recreate with new schema
DROP TABLE IF EXISTS refurb_requests CASCADE;

CREATE TABLE refurb_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Unique request identifier: STORE-YYYYMMDD-XXXX
  request_id VARCHAR(20) UNIQUE NOT NULL,

  -- Who requested
  location_id UUID REFERENCES locations(id) NOT NULL,
  tech_id UUID REFERENCES technicians(id) NOT NULL,

  -- What they need (simplified - just instrument type and quantity)
  instrument_type VARCHAR(50) NOT NULL CHECK (instrument_type IN (
    'Trumpet', 'Trombone', 'Euphonium', 'French Horn',
    'Saxophone', 'Clarinet', 'Flute', 'Violin', 'Viola', 'Cello'
  )),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,

  -- Status tracking
  -- Flow: Requested -> Shipped -> Received -> In Progress -> Complete -> Picked Up
  status VARCHAR(20) DEFAULT 'Requested' CHECK (status IN (
    'Requested',    -- Tech submitted request
    'Shipped',      -- Hub shipped with expected delivery date
    'Received',     -- Auto-set when delivery date reached
    'In Progress',  -- Tech started working on refurb
    'Complete',     -- Tech finished, ready for pickup
    'Picked Up'     -- Hub confirmed pickup
  )),

  -- Shipping info (hub fills this when marking as shipped)
  shipped_date TIMESTAMPTZ,
  expected_delivery DATE,

  -- Work tracking (tech fills this)
  started_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,

  -- Pickup tracking (hub fills this)
  picked_up_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_requests_status ON refurb_requests(status);
CREATE INDEX idx_requests_location ON refurb_requests(location_id);
CREATE INDEX idx_requests_tech ON refurb_requests(tech_id);
CREATE INDEX idx_requests_created ON refurb_requests(created_at DESC);
CREATE INDEX idx_requests_request_id ON refurb_requests(request_id);

-- =====================================================
-- Table: activity_log
-- =====================================================
DROP TABLE IF EXISTS activity_log CASCADE;

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES refurb_requests(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  performed_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_request ON activity_log(request_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE refurb_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Allow anonymous read locations" ON locations;
DROP POLICY IF EXISTS "Allow anonymous read technicians" ON technicians;
DROP POLICY IF EXISTS "Allow anonymous all refurb_requests" ON refurb_requests;
DROP POLICY IF EXISTS "Allow anonymous all activity_log" ON activity_log;
DROP POLICY IF EXISTS "Allow anonymous insert technicians" ON technicians;
DROP POLICY IF EXISTS "Allow anonymous update technicians" ON technicians;

-- Allow anonymous access for this app (simple auth)
CREATE POLICY "Allow anonymous read locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read technicians" ON technicians FOR SELECT USING (true);
CREATE POLICY "Allow anonymous all refurb_requests" ON refurb_requests FOR ALL USING (true);
CREATE POLICY "Allow anonymous all activity_log" ON activity_log FOR ALL USING (true);
CREATE POLICY "Allow anonymous insert technicians" ON technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update technicians" ON technicians FOR UPDATE USING (true);

-- =====================================================
-- Enable Realtime
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'refurb_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE refurb_requests;
  END IF;
END $$;

-- =====================================================
-- Seed Technicians
-- =====================================================
INSERT INTO technicians (name, location_id, pin)
SELECT 'Nichol', id, '1234' FROM locations WHERE store_number = '9397'
ON CONFLICT DO NOTHING;

INSERT INTO technicians (name, location_id, pin)
SELECT 'Jake', id, '1111' FROM locations WHERE store_number = '9396'
ON CONFLICT DO NOTHING;

INSERT INTO technicians (name, location_id, pin)
SELECT 'Shane', id, '3333' FROM locations WHERE store_number = '9398'
ON CONFLICT DO NOTHING;

-- =====================================================
-- Sample Request (for testing)
-- =====================================================
INSERT INTO refurb_requests (request_id, location_id, tech_id, instrument_type, quantity, notes)
SELECT
  '9397-20260115-0001',
  l.id,
  t.id,
  'Saxophone',
  5,
  'Need these ASAP for school band season'
FROM locations l
JOIN technicians t ON t.location_id = l.id
WHERE l.store_number = '9397' AND t.name = 'Nichol'
ON CONFLICT (request_id) DO NOTHING;

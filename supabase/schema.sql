-- GC Refurb Tracker Database Schema
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
-- Table: refurb_requests
-- =====================================================
CREATE TABLE IF NOT EXISTS refurb_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number SERIAL,

  -- Who requested
  location_id UUID REFERENCES locations(id) NOT NULL,
  tech_id UUID REFERENCES technicians(id) NOT NULL,

  -- What they need
  category VARCHAR(20) NOT NULL CHECK (category IN ('Brass', 'Woodwinds', 'Strings')),
  instrument_type VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  notes TEXT,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Fulfilled', 'Cancelled')),

  -- Fulfillment (manager fills this)
  quantity_fulfilled INTEGER DEFAULT 0,
  fulfilled_date TIMESTAMPTZ,
  fulfilled_by VARCHAR(100),
  fulfillment_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_requests_status ON refurb_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_location ON refurb_requests(location_id);
CREATE INDEX IF NOT EXISTS idx_requests_created ON refurb_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_tech ON refurb_requests(tech_id);

-- =====================================================
-- Table: daily_completions
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who completed
  location_id UUID REFERENCES locations(id) NOT NULL,
  tech_id UUID REFERENCES technicians(id) NOT NULL,

  -- What was completed
  category VARCHAR(20) NOT NULL CHECK (category IN ('Brass', 'Woodwinds', 'Strings')),
  instrument_type VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  quantity_completed INTEGER NOT NULL CHECK (quantity_completed > 0),

  -- QC verification (REQUIRED)
  yellow_armband_applied BOOLEAN NOT NULL DEFAULT false,
  qc_card_signed BOOLEAN NOT NULL DEFAULT false,

  notes TEXT,
  completion_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Both QC checks must be true
  CONSTRAINT qc_requirements CHECK (yellow_armband_applied = true AND qc_card_signed = true)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_completions_date ON daily_completions(completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_location ON daily_completions(location_id);
CREATE INDEX IF NOT EXISTS idx_completions_tech ON daily_completions(tech_id);

-- =====================================================
-- Table: activity_log
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES refurb_requests(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  performed_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_request ON activity_log(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- =====================================================
-- Enable Row Level Security (RLS)
-- For production, you may want to add policies
-- =====================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE refurb_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for this app (simple auth)
CREATE POLICY "Allow anonymous read locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read technicians" ON technicians FOR SELECT USING (true);
CREATE POLICY "Allow anonymous all refurb_requests" ON refurb_requests FOR ALL USING (true);
CREATE POLICY "Allow anonymous all daily_completions" ON daily_completions FOR ALL USING (true);
CREATE POLICY "Allow anonymous all activity_log" ON activity_log FOR ALL USING (true);
CREATE POLICY "Allow anonymous insert technicians" ON technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update technicians" ON technicians FOR UPDATE USING (true);

-- =====================================================
-- Enable Realtime
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE refurb_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_completions;

-- =====================================================
-- Sample Test Data (Optional - uncomment to use)
-- =====================================================

-- Add test technicians
/*
INSERT INTO technicians (name, location_id, pin) VALUES
  ('Tiffany', (SELECT id FROM locations WHERE store_number = '9397'), '1234'),
  ('Marcus', (SELECT id FROM locations WHERE store_number = '9397'), '5678'),
  ('Denise', (SELECT id FROM locations WHERE store_number = '9396'), '1111'),
  ('Robert', (SELECT id FROM locations WHERE store_number = '9396'), '2222'),
  ('Angela', (SELECT id FROM locations WHERE store_number = '9398'), '3333'),
  ('James', (SELECT id FROM locations WHERE store_number = '9398'), '4444');
*/

-- Add a sample request
/*
INSERT INTO refurb_requests (location_id, tech_id, category, instrument_type, brand, quantity_requested, priority, notes)
SELECT
  l.id,
  t.id,
  'Woodwinds',
  'Saxophone',
  'Yamaha',
  5,
  'High',
  'Need these ASAP for school band season'
FROM locations l
JOIN technicians t ON t.location_id = l.id
WHERE l.store_number = '9397' AND t.name = 'Tiffany';
*/

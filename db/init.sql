-- Create tables for Hillpointe CRM
-- UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Units table
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'held', 'leased')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'tour_scheduled', 'toured', 'application', 'leased', 'lost')),
  assigned_unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP NOT NULL,
  outcome VARCHAR(50) CHECK (outcome IN ('completed', 'no_show', 'cancelled', NULL)),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  due_date VARCHAR(50),
  state VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'done')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activity events table
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_prospects_assigned_unit_id ON prospects(assigned_unit_id);
CREATE INDEX idx_tours_prospect_id ON tours(prospect_id);
CREATE INDEX idx_tours_unit_id ON tours(unit_id);
CREATE INDEX idx_tasks_prospect_id ON tasks(prospect_id);
CREATE INDEX idx_activity_events_prospect_id ON activity_events(prospect_id);
CREATE INDEX idx_activity_events_created_at ON activity_events(created_at DESC);

-- Insert seed data
INSERT INTO units (name, status) VALUES
  ('Unit 101', 'available'),
  ('Unit 102', 'leased'),
  ('Unit 103', 'available'),
  ('Unit 201', 'held'),
  ('Unit 202', 'available'),
  ('Unit 203', 'leased')
ON CONFLICT DO NOTHING;

-- 0001_initial_schema.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create family_members table
CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_members
CREATE POLICY "Members can SELECT own rows" ON family_members
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can INSERT own rows" ON family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can UPDATE own rows" ON family_members
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can DELETE own rows" ON family_members
  FOR DELETE USING (auth.uid() = user_id);

-- Create holdings table
CREATE TABLE holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  ticker_symbol text NOT NULL,
  quantity numeric NOT NULL,
  avg_buy_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for holdings
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- RLS policies for holdings
CREATE POLICY "Holdings can SELECT own rows" ON holdings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Holdings can INSERT own rows" ON holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Holdings can UPDATE own rows" ON holdings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Holdings can DELETE own rows" ON holdings
  FOR DELETE USING (auth.uid() = user_id);

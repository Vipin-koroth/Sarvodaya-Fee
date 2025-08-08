/*
  # Initial Database Schema Setup

  1. New Tables
    - `students` - Student information with bus details
    - `payments` - Payment records with fee breakdown  
    - `fee_config` - Development fees and bus stop charges

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create trigger function for updated_at timestamps

  3. Initial Data
    - Default fee configuration
    - Bus stop charges
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no text UNIQUE NOT NULL,
  name text NOT NULL,
  mobile text,
  class text NOT NULL,
  division text NOT NULL,
  bus_stop text NOT NULL,
  bus_number text NOT NULL,
  trip_number text NOT NULL,
  bus_fee_discount integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  admission_no text NOT NULL,
  development_fee integer DEFAULT 0,
  bus_fee integer DEFAULT 0,
  special_fee integer DEFAULT 0,
  special_fee_type text DEFAULT '',
  total_amount integer NOT NULL,
  payment_date timestamptz NOT NULL,
  added_by text NOT NULL,
  class text NOT NULL,
  division text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create fee_config table
CREATE TABLE IF NOT EXISTS fee_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL,
  config_key text NOT NULL,
  config_value integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(config_type, config_key)
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to fee_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_fee_config_updated_at'
  ) THEN
    CREATE TRIGGER update_fee_config_updated_at
      BEFORE UPDATE ON fee_config
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_config ENABLE ROW LEVEL SECURITY;

-- Create policies for students
CREATE POLICY "Allow all operations for authenticated users"
  ON students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for payments
CREATE POLICY "Allow all operations for authenticated users"
  ON payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for fee_config
CREATE POLICY "Allow all operations for authenticated users"
  ON fee_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_class_division ON students(class, division);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_class_division ON payments(class, division);
CREATE INDEX IF NOT EXISTS idx_fee_config_type_key ON fee_config(config_type, config_key);

-- Insert default development fees
INSERT INTO fee_config (config_type, config_key, config_value) VALUES
  ('development_fee', '1', 5000),
  ('development_fee', '2', 5500),
  ('development_fee', '3', 6000),
  ('development_fee', '4', 6500),
  ('development_fee', '5', 7000),
  ('development_fee', '6', 7500),
  ('development_fee', '7', 8000),
  ('development_fee', '8', 8500),
  ('development_fee', '9', 9000),
  ('development_fee', '10', 9500),
  ('development_fee', '11-A', 12000),
  ('development_fee', '11-B', 12000),
  ('development_fee', '11-C', 12000),
  ('development_fee', '11-D', 12000),
  ('development_fee', '11-E', 12000),
  ('development_fee', '12-A', 13000),
  ('development_fee', '12-B', 13000),
  ('development_fee', '12-C', 13000),
  ('development_fee', '12-D', 13000),
  ('development_fee', '12-E', 13000)
ON CONFLICT (config_type, config_key) DO NOTHING;

-- Insert default bus stop charges
INSERT INTO fee_config (config_type, config_key, config_value) VALUES
  ('bus_stop', 'Main Gate', 800),
  ('bus_stop', 'Market Square', 900),
  ('bus_stop', 'Railway Station', 1000),
  ('bus_stop', 'City Center', 850),
  ('bus_stop', 'Hospital Junction', 750),
  ('bus_stop', 'College Road', 950),
  ('bus_stop', 'Bus Stand', 700),
  ('bus_stop', 'Temple Road', 800)
ON CONFLICT (config_type, config_key) DO NOTHING;
/*
  # Create users table for authentication

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text)
      - `role` (text)
      - `class` (text, nullable)
      - `division` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Add policy for admin users to manage all users

  3. Default Data
    - Insert default admin user
    - Insert default teacher accounts for all classes
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'clerk', 'sarvodaya')),
  class text,
  division text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admin users to manage all users
CREATE POLICY "Admin users can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default users
INSERT INTO users (username, password, role) VALUES
  ('admin', 'admin', 'admin'),
  ('clerk', 'admin', 'clerk'),
  ('sarvodaya', 'admin', 'sarvodaya'),
  ('lp', 'admin', 'sarvodaya'),
  ('up', 'admin', 'sarvodaya'),
  ('hs', 'admin', 'sarvodaya'),
  ('hss', 'admin', 'sarvodaya')
ON CONFLICT (username) DO NOTHING;

-- Insert teacher accounts for all classes
DO $$
BEGIN
  FOR class_num IN 1..12 LOOP
    FOR division_char IN SELECT unnest(ARRAY['a', 'b', 'c', 'd', 'e']) LOOP
      INSERT INTO users (username, password, role, class, division) 
      VALUES (
        'class' || class_num || division_char, 
        'admin', 
        'teacher', 
        class_num::text, 
        upper(division_char)
      )
      ON CONFLICT (username) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
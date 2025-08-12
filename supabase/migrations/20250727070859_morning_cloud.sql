/*
  # Add bus fee discount column to students table

  1. New Columns
    - `bus_fee_discount` (integer, default 0)
      - Stores discount amount to be subtracted from bus fee
      - Default value of 0 means no discount applied

  2. Changes
    - Adds discount functionality for bus fees
    - Allows admins to provide fee reductions to students
    - Maintains backward compatibility with existing data

  3. Security
    - No RLS changes needed as students table already has proper policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'bus_fee_discount'
  ) THEN
    ALTER TABLE students ADD COLUMN bus_fee_discount integer DEFAULT 0;
  END IF;
END $$;
/*
  # Add bus fee discount column to students table

  1. Schema Changes
    - Add `bus_fee_discount` column to `students` table
    - Column type: integer with default value 0
    - Allows admins to apply discounts to student bus fees

  2. Purpose
    - Enable administrators to provide bus fee discounts to students
    - Discount amount is deducted from total bus fee when calculating balances
    - Maintains existing data integrity with default value of 0
*/

-- Add bus_fee_discount column to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'bus_fee_discount'
  ) THEN
    ALTER TABLE students ADD COLUMN bus_fee_discount integer DEFAULT 0;
  END IF;
END $$;
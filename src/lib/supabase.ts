import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Student {
  id: string
  admission_no: string
  name: string
  mobile: string
  class: string
  division: string
  bus_stop: string
  bus_number: string
  trip_number: string
  bus_fee_discount: number
  created_at?: string
}

export interface Payment {
  id: string
  student_id: string | null
  student_name: string
  admission_no: string
  development_fee: number
  bus_fee: number
  special_fee: number
  special_fee_type: string
  total_amount: number
  payment_date: string
  added_by: string
  class: string
  division: string
  created_at?: string
}

export interface FeeConfig {
  id: string
  config_type: string
  config_key: string
  config_value: number
  created_at?: string
  updated_at?: string
}
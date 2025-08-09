import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only create client if both URL and key are properly configured
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_project_url' && 
    supabaseAnonKey !== 'your_supabase_anon_key') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.warn('⚠️ Failed to create Supabase client:', error);
    supabase = null;
  }
} else {
  console.log('ℹ️ Supabase not configured, using localStorage');
}

export { supabase };

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
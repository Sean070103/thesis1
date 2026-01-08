import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_url' && 
    supabaseAnonKey !== 'your_anon_key' &&
    supabaseUrl.startsWith('https://')
  );
};

// Create Supabase client only if configured, otherwise create a dummy client
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
};

// For backwards compatibility - but will return null if not configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as unknown as SupabaseClient;

// Database types for Supabase tables
export type Database = {
  public: {
    Tables: {
      materials: {
        Row: {
          id: string;
          material_code: string;
          description: string;
          category: string;
          unit: string;
          quantity: number;
          location: string;
          sap_quantity: number | null;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_code: string;
          description: string;
          category: string;
          unit: string;
          quantity: number;
          location: string;
          sap_quantity?: number | null;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_code?: string;
          description?: string;
          category?: string;
          unit?: string;
          quantity?: number;
          location?: string;
          sap_quantity?: number | null;
          last_updated?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          material_code: string;
          material_description: string;
          transaction_type: 'receiving' | 'issuance';
          quantity: number;
          unit: string;
          date: string;
          user_name: string;
          reference: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_code: string;
          material_description: string;
          transaction_type: 'receiving' | 'issuance';
          quantity: number;
          unit: string;
          date?: string;
          user_name: string;
          reference: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          material_code?: string;
          material_description?: string;
          transaction_type?: 'receiving' | 'issuance';
          quantity?: number;
          unit?: string;
          date?: string;
          user_name?: string;
          reference?: string;
          notes?: string | null;
        };
      };
      defects: {
        Row: {
          id: string;
          material_code: string;
          material_description: string;
          defect_type: string;
          quantity: number;
          unit: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          description: string;
          reported_by: string;
          reported_date: string;
          status: 'open' | 'in-progress' | 'resolved';
          resolution_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_code: string;
          material_description: string;
          defect_type: string;
          quantity: number;
          unit: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          description: string;
          reported_by: string;
          reported_date?: string;
          status?: 'open' | 'in-progress' | 'resolved';
          resolution_notes?: string | null;
          created_at?: string;
        };
        Update: {
          material_code?: string;
          material_description?: string;
          defect_type?: string;
          quantity?: number;
          unit?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          description?: string;
          reported_by?: string;
          reported_date?: string;
          status?: 'open' | 'in-progress' | 'resolved';
          resolution_notes?: string | null;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: 'mismatch' | 'low-stock' | 'discrepancy';
          material_code: string;
          material_description: string;
          message: string;
          local_quantity: number;
          sap_quantity: number;
          variance: number;
          severity: 'warning' | 'error' | 'critical';
          acknowledged: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'mismatch' | 'low-stock' | 'discrepancy';
          material_code: string;
          material_description: string;
          message: string;
          local_quantity: number;
          sap_quantity: number;
          variance: number;
          severity: 'warning' | 'error' | 'critical';
          acknowledged?: boolean;
          created_at?: string;
        };
        Update: {
          type?: 'mismatch' | 'low-stock' | 'discrepancy';
          material_code?: string;
          material_description?: string;
          message?: string;
          local_quantity?: number;
          sap_quantity?: number;
          variance?: number;
          severity?: 'warning' | 'error' | 'critical';
          acknowledged?: boolean;
        };
      };
    };
  };
};

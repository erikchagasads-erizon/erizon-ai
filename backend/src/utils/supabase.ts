import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config';

let serviceClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (!supabaseConfig.url || !supabaseConfig.serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required for backend database access');
  }

  if (!serviceClient) {
    serviceClient = createClient(supabaseConfig.url, supabaseConfig.serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return serviceClient;
}

export function getSupabaseAnonClient(): SupabaseClient {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
  }

  if (!anonClient) {
    anonClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  }

  return anonClient;
}

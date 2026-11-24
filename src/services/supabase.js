/**
 * Supabase Client Initialization & Service Binding
 *
 * Configured for Ilm Essentials LMS.
 * Provides client-side connection with automatic session persistence
 * and JWT bearer token forwarding for PostgreSQL Row-Level Security (RLS).
 */

import { createClient } from '@supabase/supabase-js';

const envUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_URL);
const envAnonKey = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = envUrl || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = envAnonKey || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envAnonKey &&
  !envUrl.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

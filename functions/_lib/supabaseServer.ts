import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

export interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_FALLBACK_MODEL?: string;
  OPENAI_API_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  APP_BASE_URL?: string;
}

const DEFAULT_SUPABASE_URL = 'https://ltmtmhmadsrlvuqffdcs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bXRtaG1hZHNybHZ1cWZmZGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzE2ODUsImV4cCI6MjEwNzMwNzY4NX0.UzcM8c5bmQ3u-2YmAee5oa3bOIHp7yg2H9gKMKlpF0Q';

export function getSupabaseUserClient(request: Request, env: Env): { client: SupabaseClient<Database>; token: string | null } {
  const url = env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim() || null;

  const client = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  return { client, token };
}

export function getSupabaseServiceClient(env: Env): SupabaseClient<Database> {
  const url = env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function authenticateUser(request: Request, env: Env): Promise<{ id: string; email: string; roles: string[] } | null> {
  const { client, token } = getSupabaseUserClient(request, env);
  if (!token) {
    return null;
  }

  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  // Fetch roles
  const { data: roleRecords } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const roles = (roleRecords || []).map((r: { role: string }) => r.role);
  if (roles.length === 0) {
    roles.push('student'); // Default role
  }

  return {
    id: user.id,
    email: user.email || '',
    roles,
  };
}

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const SUPABASE_URL = 'https://ltmtmhmadsrlvuqffdcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bXRtaG1hZHNybHZ1cWZmZGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzE2ODUsImV4cCI6MjEwNzMwNzY4NX0.UzcM8c5bmQ3u-2YmAee5oa3bOIHp7yg2H9gKMKlpF0Q';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function ensureDemoSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    return session.user;
  }

  // Pre-seed demo student for pilot testing
  const demoEmail = 'pilot.student@biruni.edu.tr';
  const demoPassword = 'CennaLive2026!Demo';

  let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  if (signInData?.user) {
    return signInData.user;
  }

  // If demo account not registered yet, sign up
  if (signInError) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          full_name: 'Biruni Pilot Öğrencisi (Dönem 3)',
          faculty: 'Biruni Üniversitesi Eczacılık Fakültesi',
        },
      },
    });

    if (signUpError) {
      console.warn('Supabase Auth Notice (falling back to anonymous context):', signUpError.message);
      return null;
    }
    return signUpData.user;
  }

  return null;
}

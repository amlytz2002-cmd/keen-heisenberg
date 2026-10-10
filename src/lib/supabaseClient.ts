import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const SUPABASE_URL = 'https://ibyntbynqkpkkpeoudzv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlieW50YnlucWtwa2twZW91ZHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjk5OTUsImV4cCI6MjEwNjYwNTk5NX0.LITBMKrD6mhLiFSMcIk4Yw-0OE1FBjCMYK5a4KKFCM0';

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

  if (signInError) {
    const legacyAttempt = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: 'PharmIQ2026!DemoStudent',
    });
    if (legacyAttempt.data?.user) {
      signInData = legacyAttempt.data;
      signInError = null;
    }
  }

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

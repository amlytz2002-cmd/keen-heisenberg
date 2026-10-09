import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, Env } from '../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { client } = getSupabaseUserClient(request, env);
  const { data: profile, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return errorResponse('DB_ERROR', error.message, 500);
  }

  return jsonResponse({
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles,
      profile: profile || {
        id: user.id,
        email: user.email,
        display_name: user.email.split('@')[0],
        preferred_language: 'en',
        timezone: 'UTC',
      },
    },
  });
}

export async function onRequestPut(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const { client } = getSupabaseUserClient(request, env);

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.display_name === 'string') updates.display_name = body.display_name.trim();
  if (typeof body.preferred_language === 'string') updates.preferred_language = body.preferred_language;
  if (typeof body.timezone === 'string') updates.timezone = body.timezone;
  if (body.onboarding_completed) updates.onboarding_completed = true;
  if (body.onboarding_completed_at) updates.onboarding_completed_at = new Date().toISOString();

  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return errorResponse('UPDATE_FAILED', error.message, 500);
  }

  return jsonResponse({ profile: data });
}

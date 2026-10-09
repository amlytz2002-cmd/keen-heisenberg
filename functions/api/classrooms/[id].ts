import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, Env } from '../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { client } = getSupabaseUserClient(request, env);
  const { data: classroom, error } = await client
    .from('classrooms')
    .select(`
      id,
      name,
      description,
      owner_id,
      status,
      created_at,
      classroom_members (
        id,
        user_id,
        role,
        status,
        joined_at
      ),
      courses (
        id,
        title,
        description,
        status
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !classroom) {
    return errorResponse('NOT_FOUND', 'Classroom not found or unauthorized', 404);
  }

  return jsonResponse({ classroom });
}

export async function onRequestPatch(context: { request: Request; params: { id: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const { client } = getSupabaseUserClient(request, env);

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.name === 'string') updates.name = body.name.trim();
  if (typeof body.description === 'string') updates.description = body.description.trim();
  if (body.status && ['active', 'archived'].includes(body.status)) updates.status = body.status;

  const { data: updated, error } = await client
    .from('classrooms')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return errorResponse('UPDATE_FAILED', error.message, 500);
  }

  return jsonResponse({ classroom: updated });
}

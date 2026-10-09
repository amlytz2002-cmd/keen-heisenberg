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
  
  // RLS will automatically restrict to classrooms the user is owner or member of
  const { data, error } = await client
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
        status
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse('DB_ERROR', error.message, 500);
  }

  return jsonResponse({ classrooms: data || [] });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Classroom name is required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);

  const { data: classroom, error: insertError } = await client
    .from('classrooms')
    .insert({
      name,
      description,
      owner_id: user.id,
      status: 'active',
      title: name,
      course_code: body.course_code || 'ACAD-101',
      term: body.term || 'Fall 2026',
      join_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      settings: {},
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    return errorResponse('INSERT_FAILED', insertError.message, 500);
  }

  // Add owner to classroom_members as owner/instructor
  await client.from('classroom_members').insert({
    classroom_id: classroom.id,
    user_id: user.id,
    role: 'owner',
    status: 'active',
  });

  return jsonResponse({ classroom }, 201);
}

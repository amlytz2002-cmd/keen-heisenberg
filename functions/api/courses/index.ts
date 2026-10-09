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
  const { data: courses, error } = await client
    .from('courses')
    .select(`
      id,
      title,
      description,
      subject,
      status,
      created_by,
      classroom_id,
      created_at,
      course_modules (
        id,
        title,
        position,
        status
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse('DB_ERROR', error.message, 500);
  }

  return jsonResponse({ courses: courses || [] });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';

  if (!title) {
    return errorResponse('VALIDATION_ERROR', 'Course title is required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);
  const { data: course, error } = await client
    .from('courses')
    .insert({
      title,
      description: body.description || '',
      subject: body.subject || 'General Academic',
      classroom_id: body.classroom_id || null,
      created_by: user.id,
      status: body.status || 'published',
      code: body.code || 'CRSE-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      name: title,
      term: body.term || 'Fall 2026',
      year: 2026,
    })
    .select()
    .single();

  if (error) {
    return errorResponse('INSERT_FAILED', error.message, 500);
  }

  return jsonResponse({ course }, 201);
}

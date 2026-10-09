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
  const { data: course, error } = await client
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
        description,
        position,
        status
      ),
      concepts (
        id,
        title,
        summary,
        explanation,
        difficulty,
        module_id,
        status,
        version
      ),
      resources (
        id,
        title,
        original_filename,
        mime_type,
        file_size_bytes,
        processing_status,
        created_at
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !course) {
    return errorResponse('NOT_FOUND', 'Course not found or unauthorized', 404);
  }

  return jsonResponse({ course });
}

export async function onRequestPost(context: { request: Request; params: { id: string }; env: Env }) {
  // Add module to course
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return errorResponse('VALIDATION_ERROR', 'Module title is required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);
  const { data: mod, error } = await client
    .from('course_modules')
    .insert({
      course_id: params.id,
      title,
      description: body.description || '',
      position: Number(body.position) || 0,
      status: body.status || 'published',
    })
    .select()
    .single();

  if (error) {
    return errorResponse('INSERT_FAILED', error.message, 500);
  }

  return jsonResponse({ module: mod }, 201);
}

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

  const url = new URL(request.url);
  const courseId = url.searchParams.get('courseId');
  const classroomId = url.searchParams.get('classroomId');

  const { client } = getSupabaseUserClient(request, env);
  let query = client.from('resources').select(`
    id,
    course_id,
    classroom_id,
    uploaded_by,
    title,
    storage_path,
    original_filename,
    mime_type,
    file_size_bytes,
    processing_status,
    processing_error_message,
    created_at,
    resource_chunks (count)
  `);

  if (courseId) {
    query = query.eq('course_id', courseId);
  }
  if (classroomId) {
    query = query.eq('classroom_id', classroomId);
  }

  const { data: resources, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return errorResponse('DB_ERROR', error.message, 500);
  }

  return jsonResponse({ resources: resources || [] });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const storagePath = typeof body.storagePath === 'string' ? body.storagePath.trim() : '';
  const originalFilename = typeof body.originalFilename === 'string' ? body.originalFilename.trim() : title;
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'application/pdf';
  const fileSizeBytes = Number(body.fileSizeBytes) || 1024;

  if (!title || !storagePath) {
    return errorResponse('VALIDATION_ERROR', 'Title and storagePath are required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);
  const { data: resource, error } = await client
    .from('resources')
    .insert({
      title,
      storage_path: storagePath,
      original_filename: originalFilename,
      mime_type: mimeType,
      file_size_bytes: fileSizeBytes,
      uploaded_by: user.id,
      course_id: body.courseId || null,
      classroom_id: body.classroomId || null,
      processing_status: 'uploaded',
    })
    .select()
    .single();

  if (error) {
    return errorResponse('INSERT_FAILED', error.message, 500);
  }

  // Create processing job record
  await client.from('processing_jobs').insert({
    resource_id: resource.id,
    job_type: 'document_extraction',
    status: 'queued',
    attempt_count: 0,
    idempotency_key: `job_${resource.id}_${Date.now()}`,
  });

  return jsonResponse({ resource }, 201);
}

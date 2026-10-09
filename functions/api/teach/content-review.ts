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
  const statusFilter = url.searchParams.get('status') || 'needs_review';

  const { client } = getSupabaseUserClient(request, env);

  // Fetch pending concepts
  const { data: concepts } = await client
    .from('concepts')
    .select(`
      id,
      title,
      summary,
      explanation,
      difficulty,
      status,
      version,
      created_at,
      concept_sources (
        id,
        resource_id,
        page_number,
        citation_text,
        resources (title)
      )
    `)
    .eq('status', statusFilter)
    .order('created_at', { ascending: false });

  // Fetch pending questions
  const { data: questions } = await client
    .from('questions')
    .select(`
      id,
      concept_id,
      question_type,
      difficulty,
      question_text,
      options,
      answer_key,
      explanation,
      hint_sequence,
      status,
      version,
      created_at,
      question_sources (
        id,
        resource_id,
        page_number,
        supporting_excerpt,
        resources (title)
      )
    `)
    .eq('status', statusFilter)
    .order('created_at', { ascending: false });

  return jsonResponse({
    concepts: concepts || [],
    questions: questions || [],
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const { contentType, contentId, action, edits } = body;

  if (!contentType || !contentId || !action) {
    return errorResponse('VALIDATION_ERROR', 'contentType, contentId, and action are required', 400);
  }

  const table = contentType === 'concept' ? 'concepts' : 'questions';
  const { client } = getSupabaseUserClient(request, env);

  let newStatus = 'needs_review';
  if (action === 'approve') newStatus = 'approved';
  else if (action === 'publish') newStatus = 'published';
  else if (action === 'reject') newStatus = 'rejected';
  else if (action === 'archive') newStatus = 'archived';

  const updates: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (action === 'approve' || action === 'publish') {
    updates.approved_by = user.id;
    if (action === 'publish') {
      updates.published_at = new Date().toISOString();
    }
  }

  // If instructor provided edits
  if (edits && typeof edits === 'object') {
    Object.assign(updates, edits);
    // increment version
    if (body.currentVersion) {
      updates.version = Number(body.currentVersion) + 1;
    }
  }

  const { data: updated, error } = await client
    .from(table)
    .update(updates)
    .eq('id', contentId)
    .select()
    .single();

  if (error) {
    return errorResponse('UPDATE_FAILED', error.message, 500);
  }

  // Audit log
  await client.from('audit_logs').insert({
    actor_user_id: user.id,
    action: `CONTENT_${action.toUpperCase()}`,
    target_type: table,
    target_id: contentId,
    metadata: { newStatus, contentType },
  });

  return jsonResponse({ success: true, item: updated });
}

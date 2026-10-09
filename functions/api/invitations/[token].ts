import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseServiceClient, Env } from '../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestGet(context: { params: { token: string }; env: Env }) {
  const { params, env } = context;
  const tokenHash = await sha256(params.token);
  const serviceClient = getSupabaseServiceClient(env);

  const { data: invite, error } = await serviceClient
    .from('classroom_invitations')
    .select(`
      id,
      classroom_id,
      expires_at,
      max_uses,
      use_count,
      revoked_at,
      classrooms (
        id,
        name,
        description
      )
    `)
    .eq('token_hash', tokenHash)
    .single();

  if (error || !invite) {
    return errorResponse('INVALID_TOKEN', 'Invitation is invalid or has expired', 404);
  }

  if (invite.revoked_at) {
    return errorResponse('REVOKED', 'This invitation has been revoked', 410);
  }

  if (new Date(invite.expires_at) < new Date()) {
    return errorResponse('EXPIRED', 'This invitation has expired', 410);
  }

  if (invite.max_uses && invite.use_count >= invite.max_uses) {
    return errorResponse('USAGE_LIMIT', 'This invitation has reached its maximum number of uses', 410);
  }

  return jsonResponse({
    valid: true,
    classroom: invite.classrooms,
  });
}

export async function onRequestPost(context: { request: Request; params: { token: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'You must be signed in to accept an invitation', 401);
  }

  const tokenHash = await sha256(params.token);
  const serviceClient = getSupabaseServiceClient(env);

  // Validate invitation atomically
  const { data: invite, error: fetchErr } = await serviceClient
    .from('classroom_invitations')
    .select('id, classroom_id, expires_at, max_uses, use_count, revoked_at')
    .eq('token_hash', tokenHash)
    .single();

  if (fetchErr || !invite) {
    return errorResponse('INVALID_TOKEN', 'Invalid invitation', 404);
  }

  if (invite.revoked_at || new Date(invite.expires_at) < new Date()) {
    return errorResponse('EXPIRED', 'This invitation is no longer active', 410);
  }

  if (invite.max_uses && invite.use_count >= invite.max_uses) {
    return errorResponse('USAGE_LIMIT', 'Invitation usage limit reached', 410);
  }

  // Check if user is already a member
  const { data: existingMember } = await serviceClient
    .from('classroom_members')
    .select('id, role')
    .eq('classroom_id', invite.classroom_id)
    .eq('user_id', user.id)
    .single();

  if (existingMember) {
    return jsonResponse({
      message: 'Already enrolled in this classroom',
      classroomId: invite.classroom_id,
      alreadyEnrolled: true,
    });
  }

  // Atomically increment use count
  await serviceClient
    .from('classroom_invitations')
    .update({ use_count: invite.use_count + 1 })
    .eq('id', invite.id);

  // Enroll user
  const { data: newMember, error: enrollErr } = await serviceClient
    .from('classroom_members')
    .insert({
      classroom_id: invite.classroom_id,
      user_id: user.id,
      role: 'student',
      status: 'active',
    })
    .select()
    .single();

  if (enrollErr) {
    return errorResponse('ENROLLMENT_FAILED', enrollErr.message, 500);
  }

  // Log audit event
  await serviceClient.from('audit_logs').insert({
    actor_user_id: user.id,
    action: 'CLASSROOM_JOINED',
    target_type: 'classrooms',
    target_id: invite.classroom_id,
    metadata: { invitation_id: invite.id },
  });

  return jsonResponse({
    success: true,
    classroomId: invite.classroom_id,
    membership: newMember,
  });
}

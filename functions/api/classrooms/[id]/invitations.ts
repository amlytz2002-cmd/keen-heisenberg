import { handleOptions, jsonResponse, errorResponse } from '../../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, getSupabaseServiceClient, Env } from '../../../_lib/supabaseServer';
import { sendTransactionalEmail, buildClassroomInvitationEmail } from '../../../_lib/emailService';
import { checkRateLimit, rateLimitResponse } from '../../../_lib/rateLimit';

export async function onRequestOptions() {
  return handleOptions();
}

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { client } = getSupabaseUserClient(request, env);
  const { data: invitations, error } = await client
    .from('classroom_invitations')
    .select('id, expires_at, max_uses, use_count, revoked_at, created_at')
    .eq('classroom_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse('DB_ERROR', error.message, 500);
  }

  return jsonResponse({ invitations: invitations || [] });
}

export async function onRequestPost(context: { request: Request; params: { id: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  // Rate limiting: max 20 invitations per minute per user
  const rateLimitResult = checkRateLimit(
    request,
    { maxRequests: 20, windowMs: 60_000, keyPrefix: 'create_invite' },
    user.id
  );
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const expiresInDays = Number(body.expiresInDays || body.expires_in_days) || 7;
  const maxUses = (body.maxUses || body.max_uses) ? Number(body.maxUses || body.max_uses) : null;

  // Generate high-entropy raw invite token
  const rawToken = `${crypto.randomUUID()}-${Math.random().toString(36).substring(2, 10)}`;
  const tokenHash = await sha256(rawToken);
  const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();

  const { client } = getSupabaseUserClient(request, env);
  const { data: invitation, error } = await client
    .from('classroom_invitations')
    .insert({
      classroom_id: params.id,
      created_by: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      max_uses: maxUses,
      use_count: 0,
    })
    .select('id, expires_at, max_uses, use_count, created_at')
    .single();

  if (error) {
    return errorResponse('INSERT_FAILED', error.message, 500);
  }

  const baseUrl = env.APP_BASE_URL || 'https://cenna.live';
  const inviteUrl = `${baseUrl}/invite/${rawToken}`;

  let emailDelivery = null;
  const recipientEmail = (body.recipientEmail || body.email || '').toString().trim();
  if (recipientEmail) {
    const { data: classroom } = await client
      .from('classrooms')
      .select('name')
      .eq('id', params.id)
      .single();

    const emailContent = buildClassroomInvitationEmail({
      classroomName: classroom?.name || 'Eczacılık Dönem 3 Sınıfı',
      inviterName: user.email || 'Ders Sorumlusu',
      inviteUrl,
      expiresInDays,
    });

    const serviceClient = getSupabaseServiceClient(env);
    emailDelivery = await sendTransactionalEmail(
      {
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        emailType: 'classroom_invitation',
        userId: user.id,
        idempotencyKey: `invite_${invitation.id}_${recipientEmail}`,
      },
      serviceClient,
      env.RESEND_API_KEY,
      env.RESEND_FROM_EMAIL
    );
  }

  return jsonResponse({
    invitation,
    token: rawToken,
    inviteUrl,
    emailDelivery,
  }, 201);
}

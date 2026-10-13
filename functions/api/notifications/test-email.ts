import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { Env, authenticateUser, getSupabaseUserClient, getSupabaseServiceClient } from '../../_lib/supabaseServer';
import { sendTransactionalEmail, buildTestEmail } from '../../_lib/emailService';
import { checkRateLimit, rateLimitResponse } from '../../_lib/rateLimit';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // 1. Mandatory authentication check
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Test e-postası göndermek için oturum açmalısınız.', 401);
  }

  // 2. Privilege check: only instructors or administrators may trigger test emails
  const { client } = getSupabaseUserClient(request, env);
  const { data: roles } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const isPrivileged = roles?.some((r: any) => r.role === 'admin' || r.role === 'instructor');
  if (!isPrivileged) {
    return errorResponse('FORBIDDEN', 'Yalnızca ders sorumlusu veya sistem yöneticileri test e-postası gönderebilir.', 403);
  }

  // 3. Strict rate limiting: max 5 test emails per 60 seconds per privileged user
  const rateLimitResult = checkRateLimit(
    request,
    { maxRequests: 5, windowMs: 60_000, keyPrefix: 'test_email' },
    user.id
  );
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const to = (body.to || user.email || 'delivered@resend.dev').toString().trim();

  // Validate email format
  if (!to.includes('@') || !to.includes('.')) {
    return errorResponse('INVALID_EMAIL', 'Geçerli bir e-posta adresi belirtiniz.', 400);
  }

  const supabase = getSupabaseServiceClient(env);
  const emailContent = buildTestEmail(to);

  const idempotencyKey = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const fromEmail = env.RESEND_FROM_EMAIL || 'CENNA.live <bildirim@cenna.live>';

  const result = await sendTransactionalEmail(
    {
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      emailType: 'account_notice',
      userId: user.id,
      idempotencyKey,
    },
    supabase,
    env.RESEND_API_KEY,
    fromEmail
  );

  if (!result.success) {
    return errorResponse('EMAIL_SEND_FAILED', result.error || 'E-posta gönderilemedi', 500);
  }

  return jsonResponse({
    success: true,
    messageId: result.messageId,
    recipient: to,
    from: fromEmail,
    idempotencyKey,
    cached: result.cached || false,
  });
}

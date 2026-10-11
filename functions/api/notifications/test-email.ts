import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { Env, getSupabaseServiceClient } from '../../_lib/supabaseServer';
import { sendTransactionalEmail, buildTestEmail } from '../../_lib/emailService';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const to = (body.to || 'delivered@resend.dev').toString().trim();

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

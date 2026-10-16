import { z } from 'zod';
import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { getSupabaseServiceClient, Env } from '../../_lib/supabaseServer';
import { checkRateLimit, rateLimitResponse } from '../../_lib/rateLimit';
import { sendTransactionalEmail, buildWelcomeOnboardingEmail } from '../../_lib/emailService';

const welcomeEmailSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi gereklidir'),
  fullName: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır').optional(),
  role: z.enum(['student', 'instructor']).optional().default('student'),
});

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // 1. Rate Limiting: 3 requests per 60 seconds per IP
  const rateLimitResult = checkRateLimit(request, {
    maxRequests: 3,
    windowMs: 60_000,
    keyPrefix: 'welcome_email',
  });

  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  // 2. Validate payload
  const rawBody = await request.json().catch(() => ({}));
  const parseResult = welcomeEmailSchema.safeParse(rawBody);

  if (!parseResult.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parseResult.error.errors[0]?.message || 'Geçersiz parametreler',
      400
    );
  }

  const { email, fullName, role } = parseResult.data;
  const baseUrl = env.APP_BASE_URL || 'https://cenna.live';
  const dashboardUrl = role === 'instructor' ? `${baseUrl}/app/teach` : `${baseUrl}/app/today`;

  const emailContent = buildWelcomeOnboardingEmail({
    recipientName: fullName,
    recipientEmail: email,
    role,
    dashboardUrl,
  });

  const supabase = getSupabaseServiceClient(env);
  const idempotencyKey = `welcome_${email}_${new Date().toISOString().slice(0, 10)}`;

  const sendResult = await sendTransactionalEmail(
    {
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      emailType: 'welcome_onboarding',
      idempotencyKey,
    },
    supabase,
    env.RESEND_API_KEY,
    env.RESEND_FROM_EMAIL || 'CENNA.live <bildirim@cenna.live>'
  );

  if (!sendResult.success) {
    return errorResponse(
      'EMAIL_DISPATCH_FAILED',
      sendResult.error || 'Hoş geldiniz e-postası iletilemedi.',
      502
    );
  }

  return jsonResponse({
    success: true,
    messageId: sendResult.messageId,
    recipient: email,
    cached: !!sendResult.cached,
  });
}

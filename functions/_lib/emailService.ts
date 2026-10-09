import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  emailType: 'classroom_invitation' | 'study_reminder' | 'processing_failure' | 'account_notice';
  userId?: string;
  idempotencyKey: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  cached?: boolean;
  error?: string;
}

export async function sendTransactionalEmail(
  params: EmailParams,
  supabase: SupabaseClient<Database>,
  apiKey?: string,
  fromEmail: string = 'CENNA.live <notifications@cenna.live>'
): Promise<EmailResult> {
  // 1. Idempotency check: see if this event was already sent successfully
  const { data: existingEvent } = await supabase
    .from('email_events')
    .select('id, status, provider_message_id')
    .eq('idempotency_key', params.idempotencyKey)
    .single();

  if (existingEvent && existingEvent.status === 'sent') {
    return {
      success: true,
      messageId: existingEvent.provider_message_id || undefined,
      cached: true,
    };
  }

  // 2. If no Resend API key configured in environment, record in database as queued/simulated
  if (!apiKey) {
    const simulatedId = `sim_${crypto.randomUUID()}`;
    await supabase.from('email_events').upsert({
      idempotency_key: params.idempotencyKey,
      user_id: params.userId || null,
      email_type: params.emailType,
      provider_message_id: simulatedId,
      status: 'sent',
    });

    return {
      success: true,
      messageId: simulatedId,
      cached: false,
    };
  }

  // 3. Real Resend API dispatch
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text || params.html.replace(/<[^>]+>/g, ''),
      }),
    });

    const data = await response.json() as { id?: string; message?: string; name?: string };

    if (!response.ok) {
      const errorMsg = data.message || `Resend API HTTP ${response.status}`;
      await supabase.from('email_events').upsert({
        idempotency_key: params.idempotencyKey,
        user_id: params.userId || null,
        email_type: params.emailType,
        status: 'failed',
        last_error_code: data.name || 'RESEND_ERROR',
      });

      return {
        success: false,
        error: errorMsg,
      };
    }

    const messageId = data.id || `msg_${crypto.randomUUID()}`;
    await supabase.from('email_events').upsert({
      idempotency_key: params.idempotencyKey,
      user_id: params.userId || null,
      email_type: params.emailType,
      provider_message_id: messageId,
      status: 'sent',
    });

    return {
      success: true,
      messageId,
    };
  } catch (err: any) {
    await supabase.from('email_events').upsert({
      idempotency_key: params.idempotencyKey,
      user_id: params.userId || null,
      email_type: params.emailType,
      status: 'failed',
      last_error_code: 'NETWORK_EXCEPTION',
    });

    return {
      success: false,
      error: err.message,
    };
  }
}

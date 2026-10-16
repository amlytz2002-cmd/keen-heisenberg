import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  emailType: 'classroom_invitation' | 'study_reminder' | 'processing_failure' | 'account_notice' | 'welcome_onboarding';
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
  fromEmail: string = 'CENNA.live <bildirim@cenna.live>'
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
    }, { onConflict: 'idempotency_key' });

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
      }, { onConflict: 'idempotency_key' });

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
    }, { onConflict: 'idempotency_key' });

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
    }, { onConflict: 'idempotency_key' });

    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Builds high-register academic Turkish classroom invitation email content.
 */
export function buildClassroomInvitationEmail(params: {
  classroomName?: string;
  inviterName?: string;
  inviteUrl: string;
  expiresInDays?: number;
}): { subject: string; html: string; text: string } {
  const cName = params.classroomName || 'Eczacılık Dönem 3 Klinik Farmakoloji Sınıfı';
  const iName = params.inviterName || 'Ders Sorumlusu Öğretim Üyesi';
  const days = params.expiresInDays || 7;
  const subject = `CENNA.live — Sınıf Davetiyesi: ${cName}`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CENNA<span style="color: #60a5fa;">.live</span></h1>
      <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Sağlık Bilimleri & Eczacılık İçin Akıllı Pekiştirme Platformu</p>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Sayın Öğrencimiz,</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        <strong>${iName}</strong> tarafından CENNA.live platformundaki <strong>${cName}</strong> sanal sınıfına davet edildiniz.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Sınıfa katılarak farmakoloji ve klinik kavramları aralıklı tekrar, Sokrates tipi yapay zekâ ipucu desteği ve simüle deneme sınavları eşliğinde pekiştirebilirsiniz.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Sınıfa Katılın</a>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        Bağlantı çalışmıyorsa aşağıdaki adresi tarayıcınıza kopyalayabilirsiniz:<br>
        <a href="${params.inviteUrl}" style="color: #2563eb; word-break: break-all;">${params.inviteUrl}</a>
      </p>
      <div style="margin-top: 24px; padding: 12px 16px; background-color: #f1f5f9; border-radius: 6px; font-size: 13px; color: #475569;">
        ℹ️ Bu davetiye bağlantısı <strong>${days} gün</strong> süreyle geçerlidir.
      </div>
    </div>
    <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">© 2026 CENNA.live. Tüm hakları saklıdır.</p>
      <p style="margin: 4px 0 0 0;">Bu ileti otomatik olarak gönderilmiştir. Lütfen doğrudan yanıtlamayınız.</p>
    </div>
  </div>
</body>
</html>`.trim();

  const text = `CENNA.live — Sınıf Davetiyesi\n\nSayın Öğrencimiz,\n\n${iName} tarafından CENNA.live üzerindeki "${cName}" sınıfına davet edildiniz.\n\nSınıfa katılmak için aşağıdaki bağlantıyı kullanabilirsiniz:\n${params.inviteUrl}\n\nBu davetiye ${days} gün geçerlidir.\n\nCENNA.live Ekibi`;

  return { subject, html, text };
}

/**
 * Builds high-register academic Turkish spaced review reminder email content.
 */
export function buildStudyReminderEmail(params: {
  studentName?: string;
  dueCount: number;
  studyUrl: string;
}): { subject: string; html: string; text: string } {
  const name = params.studentName || 'Değerli Öğrencimiz';
  const count = params.dueCount;
  const subject = `CENNA.live — Aralıklı Tekrar Hatırlatması (${count} Kavram Hazır)`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CENNA<span style="color: #a7f3d0;">.live</span></h1>
      <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">Aralıklı Tekrar & Kalıcı Hafıza Takibi</p>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Merhaba ${name},</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        FSRS aralıklı tekrar algoritmasına göre bugün pekiştirmeniz gereken <strong>${count} adet kavram</strong> bulunmaktadır.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Kısa bir tekrar oturumu tamamlayarak uzun süreli hafıza pekiştirme skorunuzu koruyabilirsiniz.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.studyUrl}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">Tekrara Başla</a>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        Doğrudan erişim bağlantısı:<br>
        <a href="${params.studyUrl}" style="color: #059669; word-break: break-all;">${params.studyUrl}</a>
      </p>
    </div>
    <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">© 2026 CENNA.live. Tüm hakları saklıdır.</p>
      <p style="margin: 4px 0 0 0;">Bu ileti bildirim tercihlerinize göre iletilmiştir.</p>
    </div>
  </div>
</body>
</html>`.trim();

  const text = `CENNA.live — Aralıklı Tekrar Hatırlatması\n\nMerhaba ${name},\n\nBugün tekrarlanması gereken ${count} kavram bulunmaktadır.\n\nTekrara başlamak için:\n${params.studyUrl}\n\nCENNA.live Ekibi`;

  return { subject, html, text };
}

/**
 * Builds test transactional email content for infrastructure verification.
 */
export function buildTestEmail(recipientEmail: string): { subject: string; html: string; text: string } {
  const subject = 'CENNA.live — İşlemsel E-posta Entegrasyon Doğrulaması';

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CENNA<span style="color: #60a5fa;">.live</span></h1>
      <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Resend & Supabase İşlemsel E-posta Doğrulaması</p>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Tebrikler, Entegrasyon Başarılı!</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Bu ileti, <strong>cenna.live</strong> alan adı üzerinden Resend API ve Supabase veritabanı altyapısı kullanılarak başarıyla gönderilmiştir.
      </p>
      <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Alıcı:</strong> ${recipientEmail}</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e40af;"><strong>Gönderici:</strong> bildirim@cenna.live</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e40af;"><strong>Durum:</strong> Aktif & Doğrulanmış</p>
      </div>
      <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
        Tüm e-posta etkinlikleri Supabase <code>public.email_events</code> tablosunda idempotency kontrolüyle loglanmaktadır.
      </p>
    </div>
    <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">© 2026 CENNA.live. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>`.trim();

  const text = `CENNA.live — İşlemsel E-posta Entegrasyon Doğrulaması\n\nBu ileti cenna.live üzerinden Resend API ve Supabase ile başarıyla gönderilmiştir.\nAlıcı: ${recipientEmail}\nGönderici: bildirim@cenna.live\n\nCENNA.live Ekibi`;

  return { subject, html, text };
}

/**
 * Builds high-register academic Turkish welcome and onboarding email.
 */
export function buildWelcomeOnboardingEmail(params: {
  recipientName?: string;
  recipientEmail: string;
  role?: 'student' | 'instructor';
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const name = params.recipientName || 'Değerli Kullanıcımız';
  const isInstructor = params.role === 'instructor';
  const roleTitle = isInstructor ? 'Eğitmen & Araştırmacı' : 'Öğrenci & Stajyer Eczacı';
  const subject = `CENNA.live'a Hoş Geldiniz — ${isInstructor ? 'Eğitmen Çalışma Alanınız Hazır' : 'Klinik Kurtarma Laboratuvarınız Hazır'}`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060b14; margin: 0; padding: 24px; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 14px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%); padding: 36px 28px; text-align: center; border-bottom: 1px solid #1e293b;">
      <div style="display: inline-block; padding: 4px 12px; background: rgba(14, 165, 233, 0.2); border: 1px solid #38bdf8; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #38bdf8; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">
        ${roleTitle}
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">CENNA<span style="color: #38bdf8;">.live</span></h1>
      <p style="color: #bae6fd; margin: 8px 0 0 0; font-size: 14px;">Farmasötik Kimya & Klinik Farmakoloji İçin Simülasyon Platformu</p>
    </div>
    <div style="padding: 32px 28px;">
      <h2 style="margin-top: 0; font-size: 20px; color: #f8fafc; font-weight: 700;">Hoş Geldiniz, Sayın ${name}</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">
        CENNA.live platformuna kaydınız başarıyla gerçekleşti. ${isInstructor 
          ? 'Müfredat belgelerinizi (PDF/DOCX) yapay zekâ destekli kavram haritalarına dönüştürebilir, sanal sınıflar oluşturabilir ve öğrencilerinizin Cockcroft-Gault/FSRS gelişimlerini canlı izleyebilirsiniz.' 
          : '21 adet interaktif Klinik Kurtarma Görevi, enzim parçalanma simülatörleri, reseptör cep uyumu analizleri ve FSRS aralıklı tekrar algoritması ile farmasötik yetkinliğinizi en üst düzeye taşıyabilirsiniz.'}
      </p>

      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
          Kayıtlı E-posta Adresi
        </div>
        <div style="font-size: 15px; font-family: monospace; color: #e2e8f0;">
          ${params.recipientEmail}
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.dashboardUrl}" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
          ${isInstructor ? 'Eğitmen Paneline Giriş Yap' : 'Klinik Laboratuvara Başla'}
        </a>
      </div>

      <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 8px 0;">Doğrudan erişim bağlantısı:</p>
        <a href="${params.dashboardUrl}" style="color: #38bdf8; word-break: break-all;">${params.dashboardUrl}</a>
      </div>
    </div>
    <div style="background-color: #090f1d; padding: 20px 28px; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0;">© 2026 CENNA.live. Tüm hakları saklıdır.</p>
      <p style="margin: 4px 0 0 0;">Bu ileti bildirim@cenna.live tarafından otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>`.trim();

  const text = `CENNA.live'a Hoş Geldiniz!\n\nSayın ${name},\n\nCENNA.live platformuna kaydınız başarıyla tamamlandı.\nKayıtlı e-posta: ${params.recipientEmail}\nRol: ${roleTitle}\n\nPanele erişmek için:\n${params.dashboardUrl}\n\nCENNA.live Ekibi`;

  return { subject, html, text };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendTransactionalEmail,
  buildClassroomInvitationEmail,
  buildStudyReminderEmail,
  buildTestEmail,
  EmailParams,
} from '../functions/_lib/emailService';

describe('CENNA.live Turkish Transactional Email Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Template Builders Localization & Integrity', () => {
    it('builds classroom invitation email with academic Turkish copy', () => {
      const email = buildClassroomInvitationEmail({
        classroomName: 'Biruni Eczacılık Dönem 3 Klinik Farmakoloji',
        inviterName: 'Prof. Dr. Ahmet Yılmaz',
        inviteUrl: 'https://cenna.live/invite/pilot-2026',
        expiresInDays: 7,
      });

      expect(email.subject).toContain('CENNA.live — Sınıf Davetiyesi');
      expect(email.subject).toContain('Biruni Eczacılık Dönem 3 Klinik Farmakoloji');
      expect(email.html).toContain('Sayın Öğrencimiz,');
      expect(email.html).toContain('Prof. Dr. Ahmet Yılmaz');
      expect(email.html).toContain('https://cenna.live/invite/pilot-2026');
      expect(email.html).toContain('7 gün');
      expect(email.html).toContain('Sınıfa Katılın');
      expect(email.text).toContain('https://cenna.live/invite/pilot-2026');
    });

    it('builds study reminder email with FSRS spaced repetition copy', () => {
      const email = buildStudyReminderEmail({
        studentName: 'Zeynep Kaya',
        dueCount: 14,
        studyUrl: 'https://cenna.live/student/study',
      });

      expect(email.subject).toBe('CENNA.live — Aralıklı Tekrar Hatırlatması (14 Kavram Hazır)');
      expect(email.html).toContain('Merhaba Zeynep Kaya');
      expect(email.html).toContain('14 adet kavram');
      expect(email.html).toContain('FSRS aralıklı tekrar algoritmasına göre');
      expect(email.html).toContain('Tekrara Başla');
      expect(email.html).toContain('https://cenna.live/student/study');
      expect(email.text).toContain('14 kavram');
    });

    it('builds infrastructure test email with verification details', () => {
      const email = buildTestEmail('pilot.student@biruni.edu.tr');

      expect(email.subject).toBe('CENNA.live — İşlemsel E-posta Entegrasyon Doğrulaması');
      expect(email.html).toContain('Tebrikler, Entegrasyon Başarılı!');
      expect(email.html).toContain('pilot.student@biruni.edu.tr');
      expect(email.html).toContain('bildirim@cenna.live');
      expect(email.text).toContain('pilot.student@biruni.edu.tr');
    });
  });

  describe('Transactional Dispatch & Idempotency Engine', () => {
    it('returns cached result immediately when idempotencyKey already sent', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'evt-1',
                  status: 'sent',
                  provider_message_id: 'msg_existing_123',
                },
              }),
            }),
          }),
        }),
      } as any;

      const params: EmailParams = {
        to: 'student@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        emailType: 'classroom_invitation',
        idempotencyKey: 'idemp_key_123',
      };

      const result = await sendTransactionalEmail(params, mockSupabase, 're_key');

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.messageId).toBe('msg_existing_123');
    });

    it('records simulated event when Resend API key is omitted', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          upsert: upsertMock,
        }),
      } as any;

      const params: EmailParams = {
        to: 'student@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        emailType: 'study_reminder',
        idempotencyKey: 'sim_test_key',
      };

      const result = await sendTransactionalEmail(params, mockSupabase, undefined);

      expect(result.success).toBe(true);
      expect(result.cached).toBe(false);
      expect(result.messageId).toMatch(/^sim_/);
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotency_key: 'sim_test_key',
          status: 'sent',
        })
      );
    });

    it('calls Resend API and stores message ID on successful dispatch', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          upsert: upsertMock,
        }),
      } as any;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'resend_msg_abc789' }),
      } as Response);

      const params: EmailParams = {
        to: 'student@example.com',
        subject: 'CENNA.live Bildirimi',
        html: '<p>Merhaba</p>',
        emailType: 'classroom_invitation',
        idempotencyKey: 'live_test_key',
      };

      const result = await sendTransactionalEmail(
        params,
        mockSupabase,
        're_test_key',
        'CENNA.live <bildirim@cenna.live>'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('resend_msg_abc789');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer re_test_key',
          }),
          body: JSON.stringify({
            from: 'CENNA.live <bildirim@cenna.live>',
            to: ['student@example.com'],
            subject: 'CENNA.live Bildirimi',
            html: '<p>Merhaba</p>',
            text: 'Merhaba',
          }),
        })
      );
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotency_key: 'live_test_key',
          provider_message_id: 'resend_msg_abc789',
          status: 'sent',
        })
      );
    });

    it('handles Resend API error and logs failure status to database', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          upsert: upsertMock,
        }),
      } as any;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          name: 'validation_error',
          message: 'The from address does not belong to a verified domain',
        }),
      } as Response);

      const params: EmailParams = {
        to: 'unverified@example.com',
        subject: 'CENNA.live Bildirimi',
        html: '<p>Merhaba</p>',
        emailType: 'classroom_invitation',
        idempotencyKey: 'fail_test_key',
      };

      const result = await sendTransactionalEmail(
        params,
        mockSupabase,
        're_test_key',
        'CENNA.live <bildirim@cenna.live>'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('The from address does not belong to a verified domain');
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotency_key: 'fail_test_key',
          status: 'failed',
          last_error_code: 'validation_error',
        })
      );
    });
  });
});

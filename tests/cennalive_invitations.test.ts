import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

interface InvitationRecord {
  token_hash: string;
  max_uses: number;
  times_used: number;
  expires_at: string;
  classroom_id: string;
}

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function validateInvitation(
  rawToken: string,
  record: InvitationRecord,
  nowIso?: string
): { isValid: boolean; error?: string } {
  const incomingHash = hashToken(rawToken);
  if (incomingHash !== record.token_hash) {
    return { isValid: false, error: 'Invalid invitation token' };
  }

  const now = nowIso ? new Date(nowIso) : new Date();
  if (new Date(record.expires_at).getTime() < now.getTime()) {
    return { isValid: false, error: 'Invitation has expired' };
  }

  if (record.times_used >= record.max_uses) {
    return { isValid: false, error: 'Invitation redemption limit reached' };
  }

  return { isValid: true };
}

describe('CENNA.live Cryptographic Classroom Invitations', () => {
  const rawToken = 'inv_test_token_9834abcd';
  const hashed = hashToken(rawToken);

  const baseRecord: InvitationRecord = {
    token_hash: hashed,
    max_uses: 25,
    times_used: 10,
    expires_at: '2026-10-20T00:00:00.000Z',
    classroom_id: 'cr-449',
  };

  it('validates active, unexpired invitation within usage limits', () => {
    const res = validateInvitation(rawToken, baseRecord, '2026-10-10T12:00:00.000Z');
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('rejects tampered or mismatched raw token', () => {
    const res = validateInvitation('inv_wrong_token', baseRecord, '2026-10-10T12:00:00.000Z');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Invalid invitation token');
  });

  it('rejects expired invitation token', () => {
    const res = validateInvitation(rawToken, baseRecord, '2026-10-25T12:00:00.000Z'); // After Oct 20
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Invitation has expired');
  });

  it('rejects exhausted invitation token when times_used reaches max_uses', () => {
    const exhaustedRecord: InvitationRecord = {
      ...baseRecord,
      times_used: 25,
      max_uses: 25,
    };

    const res = validateInvitation(rawToken, exhaustedRecord, '2026-10-10T12:00:00.000Z');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Invitation redemption limit reached');
  });
});

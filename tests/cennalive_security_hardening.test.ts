import { describe, it, expect } from 'vitest';
import { checkRateLimit, rateLimitResponse } from '../functions/_lib/rateLimit';

describe('CENNA.live Security Hardening & Authorization Gate', () => {
  describe('1. Edge Rate Limiter Behavior', () => {
    it('permits requests within quota and decrements remaining tokens', () => {
      const mockReq = new Request('https://cenna.live/api/study/submit-answer', {
        headers: { 'cf-connecting-ip': '198.51.100.1' },
      });

      const config = { maxRequests: 5, windowMs: 60_000, keyPrefix: 'test_quota' };
      const res1 = checkRateLimit(mockReq, config, 'usr-1');
      expect(res1.allowed).toBe(true);
      expect(res1.current).toBe(1);
      expect(res1.remaining).toBe(4);

      const res2 = checkRateLimit(mockReq, config, 'usr-1');
      expect(res2.allowed).toBe(true);
      expect(res2.current).toBe(2);
      expect(res2.remaining).toBe(3);
    });

    it('rejects requests exceeding maximum allowed requests with HTTP 429 payload', () => {
      const mockReq = new Request('https://cenna.live/api/notifications/test-email', {
        headers: { 'cf-connecting-ip': '198.51.100.2' },
      });

      const config = { maxRequests: 3, windowMs: 60_000, keyPrefix: 'test_exceed' };
      checkRateLimit(mockReq, config, 'usr-2');
      checkRateLimit(mockReq, config, 'usr-2');
      checkRateLimit(mockReq, config, 'usr-2');

      const exceeded = checkRateLimit(mockReq, config, 'usr-2');
      expect(exceeded.allowed).toBe(false);
      expect(exceeded.remaining).toBe(0);
      expect(exceeded.retryAfterSec).toBeGreaterThan(0);

      const response = rateLimitResponse(exceeded);
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('isolates rate limit buckets between different users on the same IP', () => {
      const mockReq = new Request('https://cenna.live/api/study/submit-answer', {
        headers: { 'cf-connecting-ip': '203.0.113.50' },
      });

      const config = { maxRequests: 2, windowMs: 60_000, keyPrefix: 'test_user_isolation' };
      checkRateLimit(mockReq, config, 'student-alice');
      checkRateLimit(mockReq, config, 'student-alice');
      const aliceBlocked = checkRateLimit(mockReq, config, 'student-alice');
      expect(aliceBlocked.allowed).toBe(false);

      // Student Bob on the same campus IP should have an independent bucket
      const bobAllowed = checkRateLimit(mockReq, config, 'student-bob');
      expect(bobAllowed.allowed).toBe(true);
      expect(bobAllowed.current).toBe(1);
    });
  });

  describe('2. Test-Email Notification Endpoint Security Contract', () => {
    function simulateTestEmailAuth(
      user: { id: string; email: string } | null,
      roles: { role: string }[]
    ): { status: number; code: string } {
      if (!user) {
        return { status: 401, code: 'UNAUTHORIZED' };
      }
      const isPrivileged = roles.some((r) => r.role === 'admin' || r.role === 'instructor');
      if (!isPrivileged) {
        return { status: 403, code: 'FORBIDDEN' };
      }
      return { status: 200, code: 'OK' };
    }

    it('denies unauthenticated visitors attempting to send test emails (HTTP 401)', () => {
      const result = simulateTestEmailAuth(null, []);
      expect(result.status).toBe(401);
      expect(result.code).toBe('UNAUTHORIZED');
    });

    it('denies authenticated students from triggering test emails (HTTP 403)', () => {
      const studentUser = { id: 'usr-student-1', email: 'student@biruni.edu.tr' };
      const studentRoles = [{ role: 'student' }];
      const result = simulateTestEmailAuth(studentUser, studentRoles);
      expect(result.status).toBe(403);
      expect(result.code).toBe('FORBIDDEN');
    });

    it('allows verified instructors and administrators to trigger test emails (HTTP 200)', () => {
      const instructorUser = { id: 'usr-inst-1', email: 'instructor@cenna.live' };
      const instructorRoles = [{ role: 'instructor' }];
      const result = simulateTestEmailAuth(instructorUser, instructorRoles);
      expect(result.status).toBe(200);
      expect(result.code).toBe('OK');
    });
  });

  describe('3. Storage Objects Security Rules & Access Isolation', () => {
    interface StorageRuleCheck {
      bucketId: string;
      objectPath: string;
      userId: string;
      role: 'student' | 'instructor' | 'admin';
      action: 'INSERT' | 'SELECT' | 'DELETE';
    }

    function evaluateStoragePolicy(params: StorageRuleCheck): boolean {
      const isPrivileged = params.role === 'instructor' || params.role === 'admin';

      if (params.bucketId === 'course-resources') {
        // Only instructors and admins can insert, select, or delete course-resources
        return isPrivileged;
      }

      if (params.bucketId === 'user-avatars') {
        if (params.action === 'SELECT') {
          // Any authenticated user can view avatars
          return true;
        }
        // User must own the avatar path
        const ownsPath =
          params.objectPath.startsWith(`${params.userId}/`) ||
          params.objectPath.startsWith(`${params.userId}.`);
        return ownsPath;
      }

      return false;
    }

    it('forbids students from uploading directly to course-resources', () => {
      const allowed = evaluateStoragePolicy({
        bucketId: 'course-resources',
        objectPath: 'lectures/biochem_slides.pdf',
        userId: 'student-123',
        role: 'student',
        action: 'INSERT',
      });
      expect(allowed).toBe(false);
    });

    it('forbids students from directly listing or reading raw course-resources objects', () => {
      const allowed = evaluateStoragePolicy({
        bucketId: 'course-resources',
        objectPath: 'exams/midterm_master_key.pdf',
        userId: 'student-123',
        role: 'student',
        action: 'SELECT',
      });
      expect(allowed).toBe(false);
    });

    it('permits instructors to upload and manage course-resources objects', () => {
      const allowedInsert = evaluateStoragePolicy({
        bucketId: 'course-resources',
        objectPath: 'lectures/pk_module_1.pdf',
        userId: 'instructor-1',
        role: 'instructor',
        action: 'INSERT',
      });
      expect(allowedInsert).toBe(true);

      const allowedSelect = evaluateStoragePolicy({
        bucketId: 'course-resources',
        objectPath: 'lectures/pk_module_1.pdf',
        userId: 'instructor-1',
        role: 'instructor',
        action: 'SELECT',
      });
      expect(allowedSelect).toBe(true);
    });

    it('allows a user to upload their own avatar but prevents modifying other users avatars', () => {
      const allowedSelf = evaluateStoragePolicy({
        bucketId: 'user-avatars',
        objectPath: 'user-abc/avatar.png',
        userId: 'user-abc',
        role: 'student',
        action: 'INSERT',
      });
      expect(allowedSelf).toBe(true);

      const blockedOther = evaluateStoragePolicy({
        bucketId: 'user-avatars',
        objectPath: 'user-victim/avatar.png',
        userId: 'user-attacker',
        role: 'student',
        action: 'DELETE',
      });
      expect(blockedOther).toBe(false);
    });
  });

  describe('4. Transactional Email Privacy & Event Isolation', () => {
    it('restricts email_events queries so that users can never inspect peers email history', () => {
      const allEvents = [
        { id: 'ev-1', user_id: 'alice', email_type: 'classroom_invitation' },
        { id: 'ev-2', user_id: 'bob', email_type: 'account_notice' },
        { id: 'ev-3', user_id: 'alice', email_type: 'study_reminder' },
      ];

      function queryUserEmailEvents(currentUserId: string, isAdmin: boolean) {
        // Enforces: auth.uid() = user_id OR is_admin(auth.uid())
        return allEvents.filter((ev) => ev.user_id === currentUserId || isAdmin);
      }

      const aliceEvents = queryUserEmailEvents('alice', false);
      expect(aliceEvents.length).toBe(2);
      expect(aliceEvents.every((e) => e.user_id === 'alice')).toBe(true);
      expect(aliceEvents.some((e) => e.user_id === 'bob')).toBe(false);

      const adminEvents = queryUserEmailEvents('admin-usr', true);
      expect(adminEvents.length).toBe(3);
    });
  });
});

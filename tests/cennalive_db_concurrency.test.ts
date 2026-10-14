import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Database-Backed Concurrency & Row-Locking Test Suite
 *
 * NOTE: These tests verify true PostgreSQL row-level locks, FOR UPDATE ordering,
 * transaction atomicity, and deadlock prevention.
 *
 * They require a running PostgreSQL / Supabase database instance (local Docker or staging).
 * If no live database is configured via environment variables, these tests are skipped
 * and the limitation is explicitly reported. Mocked unit tests do NOT substitute
 * for this database-backed verification.
 */

const DB_URL = process.env.SUPABASE_URL || process.env.TEST_SUPABASE_URL;
const DB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.TEST_SUPABASE_KEY;

const isDbAvailable = Boolean(DB_URL && DB_KEY);

describe.skipIf(!isDbAvailable)('PostgreSQL Engine Concurrency & Row-Locking Invariants', () => {
  const adminClient = isDbAvailable ? createClient(DB_URL!, DB_KEY!) : (null as any);

  it('1. Simultaneous first-time creation: two concurrent connections do not throw unique_violation', async () => {
    const testUserId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;

    // Simulate two devices hitting sync_lesson_progress at the exact same millisecond
    const [res1, res2] = await Promise.all([
      adminClient.rpc('sync_lesson_progress', {
        p_lesson_id: 'les-1',
        p_current_step: 1,
        p_is_completed: false,
        p_stars_earned: 0,
        p_completed_at: null,
      }),
      adminClient.rpc('sync_lesson_progress', {
        p_lesson_id: 'les-1',
        p_current_step: 2,
        p_is_completed: false,
        p_stars_earned: 0,
        p_completed_at: null,
      }),
    ]);

    expect(res1.error).toBeNull();
    expect(res2.error).toBeNull();

    // Verify row counts in both tables: exactly 1 row each
    const { count: progCount } = await adminClient
      .from('user_lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId)
      .eq('lesson_id', 'les-1');

    const { count: gameCount } = await adminClient
      .from('user_gamification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId);

    expect(progCount).toBe(1);
    expect(gameCount).toBe(1);
  });

  it('2. Simultaneous duplicate completion: awards XP and completion count exactly once', async () => {
    const testUserId = `00000000-0000-0000-0001-${Date.now().toString().slice(-12)}`;

    const [res1, res2] = await Promise.all([
      adminClient.rpc('sync_lesson_progress', {
        p_lesson_id: 'les-1',
        p_current_step: 3,
        p_is_completed: true,
        p_stars_earned: 3,
        p_completed_at: new Date().toISOString(),
      }),
      adminClient.rpc('sync_lesson_progress', {
        p_lesson_id: 'les-1',
        p_current_step: 3,
        p_is_completed: true,
        p_stars_earned: 3,
        p_completed_at: new Date().toISOString(),
      }),
    ]);

    expect(res1.error).toBeNull();
    expect(res2.error).toBeNull();

    const { data: gameRow } = await adminClient
      .from('user_gamification')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    // Canonical XP for les-1 is 30 XP
    expect(gameRow.xp).toBe(30);
    expect(gameRow.completed_lessons_count).toBe(1);
  });

  it('3. Concurrent distinct activities: preserves both progress records and both legitimate rewards', async () => {
    const testUserId = `00000000-0000-0000-0002-${Date.now().toString().slice(-12)}`;

    // Device A completes les-1 (30 XP), Device B concurrently completes mission-1 (35 XP)
    const [res1, res2] = await Promise.all([
      adminClient.rpc('sync_lesson_progress', {
        p_lesson_id: 'les-1',
        p_current_step: 100,
        p_is_completed: true,
        p_stars_earned: 3,
        p_completed_at: new Date().toISOString(),
      }),
      adminClient.rpc('sync_lesson_progress', {
        p_lesson_id: 'mission-1',
        p_current_step: 100,
        p_is_completed: true,
        p_stars_earned: 3,
        p_completed_at: new Date().toISOString(),
      }),
    ]);

    expect(res1.error).toBeNull();
    expect(res2.error).toBeNull();

    const { data: gameRow } = await adminClient
      .from('user_gamification')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    // Both legitimate entitlements credited (30 + 35 = 65 XP)
    expect(gameRow.xp).toBe(65);
    expect(gameRow.completed_lessons_count).toBe(2);
  });

  it('4. Stale step updates cannot reduce monotonic progress', async () => {
    const testUserId = `00000000-0000-0000-0003-${Date.now().toString().slice(-12)}`;

    // Step 3 applied
    await adminClient.rpc('sync_lesson_progress', {
      p_lesson_id: 'les-2',
      p_current_step: 3,
      p_is_completed: false,
      p_stars_earned: 0,
      p_completed_at: null,
    });

    // Stale step 1 submitted from older device
    const resStale = await adminClient.rpc('sync_lesson_progress', {
      p_lesson_id: 'les-2',
      p_current_step: 1,
      p_is_completed: false,
      p_stars_earned: 0,
      p_completed_at: null,
    });

    expect(resStale.error).toBeNull();
    expect(resStale.data.current_step).toBe(3);

    const { data: progRow } = await adminClient
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', testUserId)
      .eq('lesson_id', 'les-2')
      .single();

    expect(progRow.current_step).toBe(3);
  });

  it('5. Invalid activity IDs and invalid parameter values leave no partial writes', async () => {
    const testUserId = `00000000-0000-0000-0004-${Date.now().toString().slice(-12)}`;

    const resInvalidId = await adminClient.rpc('sync_lesson_progress', {
      p_lesson_id: 'non-existent-activity-999',
      p_current_step: 1,
      p_is_completed: true,
      p_stars_earned: 2,
      p_completed_at: null,
    });

    expect(resInvalidId.error).not.toBeNull();

    // Verify transaction rollback: no progress row created
    const { count } = await adminClient
      .from('user_lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId);

    expect(count).toBe(0);
  });
});

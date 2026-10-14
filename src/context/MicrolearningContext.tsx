import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { UserLessonProgress, UserGamificationState } from '../types/microlearning';
import { getAllTier1Lessons } from '../data/courses/medicinalChemistryTier1';
import { getAllMissions } from '../data/courses/medicinalChemistryMissions';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface MicrolearningContextType {
  userProgress: Record<string, UserLessonProgress>;
  gamification: UserGamificationState;
  isLoading: boolean;
  syncError: string | null;
  retrySync: () => Promise<void>;
  getLessonProgress: (lessonId: string) => UserLessonProgress | undefined;
  isLessonUnlocked: (lessonId: string) => boolean;
  updateStepProgress: (lessonId: string, stepNumber: number) => Promise<void>;
  completeLesson: (lessonId: string, stars: number, xpReward: number) => Promise<void>;
  // Mission specific methods (Milestone 3)
  getMissionProgress: (missionId: string) => UserLessonProgress | undefined;
  isMissionUnlocked: (missionId: string) => boolean;
  updateMissionStepProgress: (missionId: string, stepNumber: number) => Promise<void>;
  completeMission: (missionId: string, stars: number, xpReward: number) => Promise<void>;
  resetProgress: () => void;
}

const DEFAULT_GAMIFICATION: UserGamificationState = {
  streak: 3, // Initial starter streak for high student motivation
  xp: 120,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedLessonsCount: 0,
};

export interface PendingSyncState {
  lessons: Record<string, UserLessonProgress>;
  gamificationPending: boolean;
}

/**
 * Storage key helpers - strictly separated per authenticated identity with dedicated guest slot.
 * Legacy unscoped keys ('cenna_microlearning_*_v1') are intentionally unread to prevent cross-account leakage.
 */
export const getProgressStorageKey = (userId: string | null | undefined): string => {
  return userId ? `cenna_microlearning_progress_${userId}` : 'cenna_microlearning_progress_guest';
};

export const getGamificationStorageKey = (userId: string | null | undefined): string => {
  return userId ? `cenna_microlearning_gamification_${userId}` : 'cenna_microlearning_gamification_guest';
};

export const getPendingSyncStorageKey = (userId: string | null | undefined): string => {
  return userId ? `cenna_microlearning_pending_sync_${userId}` : 'cenna_microlearning_pending_sync_guest';
};

function loadLocalPendingSync(userId: string | null | undefined): PendingSyncState {
  try {
    const key = getPendingSyncStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { lessons: {}, gamificationPending: false };
}

function loadLocalProgress(userId: string | null | undefined): Record<string, UserLessonProgress> {
  try {
    const key = getProgressStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
}

function loadLocalGamification(userId: string | null | undefined): UserGamificationState {
  try {
    const key = getGamificationStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return DEFAULT_GAMIFICATION;
}

const MicrolearningContext = createContext<MicrolearningContextType | undefined>(undefined);

/**
 * Normalizes between mission-X and les-X IDs for transparent cross-compatibility
 */
function getPairedId(id: string): string | null {
  if (id.startsWith('mission-')) {
    return id.replace('mission-', 'les-');
  }
  if (id.startsWith('les-')) {
    return id.replace('les-', 'mission-');
  }
  return null;
}

export const MicrolearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const currentUserId = user?.id ?? null;

  const [userProgress, setUserProgress] = useState<Record<string, UserLessonProgress>>({});
  const [gamification, setGamification] = useState<UserGamificationState>(DEFAULT_GAMIFICATION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Synchronous refs to guarantee atomic state computation across concurrent ticks
  const userProgressRef = useRef<Record<string, UserLessonProgress>>({});
  const gamificationRef = useRef<UserGamificationState>(DEFAULT_GAMIFICATION);

  // Guards against server writes until the active user's remote state is fully loaded
  const loadedUserIdRef = useRef<string | null | undefined>(undefined);
  const activeUserIdRef = useRef<string | null>(currentUserId);
  activeUserIdRef.current = currentUserId;

  const pendingSyncRef = useRef<PendingSyncState>(loadLocalPendingSync(currentUserId));
  const isSyncingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const storageErrorRef = useRef<string | null>(null);

  const persistPendingSync = useCallback(
    (userId: string | null | undefined, state: PendingSyncState) => {
      pendingSyncRef.current = state;
      try {
        const key = getPendingSyncStorageKey(userId);
        localStorage.setItem(key, JSON.stringify(state));
        storageErrorRef.current = null;
      } catch (err: any) {
        console.warn('[MicrolearningContext] Failed to persist pending sync queue to localStorage:', err);
        const errMsg = 'Yerel depolama alanı dolu veya erişilemiyor. Çevrimdışı veriler kalıcı olarak kaydedilemedi.';
        storageErrorRef.current = errMsg;
        setSyncError(errMsg);
        message.warning({
          content: 'Yerel depolama alanı dolu veya erişilemiyor. Çevrimdışı değişiklikler kalıcı olarak kaydedilemeyebilir.',
          key: 'cenna-sync-status',
          duration: 4,
        });
      }
    },
    []
  );

  const flushPendingSync = useCallback(
    async (userId?: string | null, options?: { silent?: boolean }) => {
      const targetUser = userId ?? activeUserIdRef.current;
      if (!targetUser || loadedUserIdRef.current !== targetUser) return;
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        let hasError = false;
        let lastErrorMsg = '';
        let hasCompletedLesson = false;

        // Drain the queue with a loop in case concurrent updates arrive during in-flight network requests
        while (true) {
          if (!isMountedRef.current || activeUserIdRef.current !== targetUser) return;

          const pending = { ...pendingSyncRef.current };
          const lessonEntries = Object.entries(pending.lessons);
          const wasGamificationPending = pending.gamificationPending;

          if (lessonEntries.length === 0 && !wasGamificationPending) {
            break; // All pending work has successfully synchronized
          }

          if (
            lessonEntries.some(([_, p]) => p.isCompleted) ||
            wasGamificationPending
          ) {
            hasCompletedLesson = true;
          }

          let roundProcessedCount = 0;
          let roundErrorCount = 0;

          // 1. Flush pending lessons
          for (const [id, progressRecord] of lessonEntries) {
            if (!isMountedRef.current || activeUserIdRef.current !== targetUser) return;
            try {
              const payload: Record<string, any> = {
                user_id: targetUser,
                lesson_id: id,
                current_step: progressRecord.currentStep,
                updated_at: new Date().toISOString(),
              };
              if (progressRecord.isCompleted) {
                payload.is_completed = true;
                payload.stars_earned = progressRecord.starsEarned;
                if (progressRecord.completedAt) {
                  payload.completed_at = progressRecord.completedAt;
                }
              }

              const { error } = await supabase
                .from('user_lesson_progress')
                .upsert(payload, { onConflict: 'user_id,lesson_id' });

              if (!isMountedRef.current || activeUserIdRef.current !== targetUser) return;

              if (error) {
                hasError = true;
                roundErrorCount++;
                lastErrorMsg = error.message;
              } else {
                roundProcessedCount++;
                // Concurrency-safe deletion: Only remove if the queued entry has not been updated in the meantime
                const currentPending = pendingSyncRef.current;
                const queued = currentPending.lessons[id];
                if (
                  queued &&
                  queued.currentStep <= progressRecord.currentStep &&
                  queued.isCompleted === progressRecord.isCompleted &&
                  queued.starsEarned <= progressRecord.starsEarned
                ) {
                  const updatedLessons = { ...currentPending.lessons };
                  delete updatedLessons[id];
                  persistPendingSync(targetUser, {
                    ...currentPending,
                    lessons: updatedLessons,
                  });
                }
              }
            } catch (err: any) {
              if (!isMountedRef.current || activeUserIdRef.current !== targetUser) return;
              hasError = true;
              roundErrorCount++;
              lastErrorMsg = err?.message || 'Sunucu senkronizasyon hatası';
            }
          }

          // 2. Flush pending gamification
          if (pendingSyncRef.current.gamificationPending) {
            if (!isMountedRef.current || activeUserIdRef.current !== targetUser) return;
            const snapshotGame = gamificationRef.current;
            try {
              const { error } = await supabase
                .from('user_gamification')
                .upsert({
                  user_id: targetUser,
                  streak: snapshotGame.streak,
                  xp: snapshotGame.xp,
                  last_active_date: snapshotGame.lastActiveDate,
                  completed_lessons_count: snapshotGame.completedLessonsCount,
                  updated_at: new Date().toISOString(),
                });

              if (!isMountedRef.current || activeUserIdRef.current !== targetUser) return;

              if (error) {
                hasError = true;
                roundErrorCount++;
                lastErrorMsg = error.message;
              } else {
                roundProcessedCount++;
                // Concurrency-safe clear: Only clear gamificationPending if gamificationRef hasn't advanced in the meantime
                const currentGame = gamificationRef.current;
                if (
                  currentGame.xp <= snapshotGame.xp &&
                  currentGame.completedLessonsCount <= snapshotGame.completedLessonsCount &&
                  currentGame.streak <= snapshotGame.streak
                ) {
                  const currentPending = pendingSyncRef.current;
                  persistPendingSync(targetUser, {
                    ...currentPending,
                    gamificationPending: false,
                  });
                }
              }
            } catch (err: any) {
              if (!isMountedRef.current || activeUserIdRef.current !== targetUser) return;
              hasError = true;
              roundErrorCount++;
              lastErrorMsg = err?.message || 'Sunucu senkronizasyon hatası';
            }
          }

          // If every attempted item in this round resulted in an error, break to prevent infinite spinning
          if (roundErrorCount > 0 && roundProcessedCount === 0) {
            break;
          }
        }

        if (!isMountedRef.current || activeUserIdRef.current !== targetUser) return;

        const finalPending = pendingSyncRef.current;
        const remainingCount =
          Object.keys(finalPending.lessons).length + (finalPending.gamificationPending ? 1 : 0);

        const hasStorageError = !!storageErrorRef.current;

        if (hasError || remainingCount > 0 || hasStorageError) {
          const errMsg = storageErrorRef.current || lastErrorMsg || 'Senkronizasyon tamamlanamadı';
          setSyncError(errMsg);
          if (!options?.silent && hasError) {
            message.warning({
              content: hasCompletedLesson
                ? 'Ders tamamlandı ve yerel hafızaya kaydedildi, ancak bulut sunucusuna senkronize edilemedi. İnternet bağlantınızı kontrol edin.'
                : 'İlerlemeniz yerel olarak kaydedildi, ancak sunucu senkronizasyonu başarısız oldu.',
              key: 'cenna-sync-status',
              duration: 4,
            });
          }
        } else {
          setSyncError(null);
        }
      } finally {
        isSyncingRef.current = false;
      }
    },
    [persistPendingSync]
  );

  const retrySync = useCallback(async () => {
    const activeUser = activeUserIdRef.current;
    if (activeUser && loadedUserIdRef.current === activeUser) {
      await flushPendingSync(activeUser);
    }
  }, [flushPendingSync]);

  // Automatically flush pending writes when browser regains internet connectivity
  useEffect(() => {
    const handleOnline = () => {
      const activeUser = activeUserIdRef.current;
      if (activeUser && loadedUserIdRef.current === activeUser) {
        flushPendingSync(activeUser);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [flushPendingSync]);

  // Reload progress when authentication identity changes
  useEffect(() => {
    setSyncError(null);
    if (authLoading) {
      loadedUserIdRef.current = undefined;
      setIsLoading(true);
      return;
    }

    let isMounted = true;
    const targetUserId = currentUserId;

    // 1. Immediately switch in-memory state to the cached local state for this identity (guest or user)
    const localProgress = loadLocalProgress(targetUserId);
    const localGamification = loadLocalGamification(targetUserId);
    const localPendingSync = loadLocalPendingSync(targetUserId);

    userProgressRef.current = localProgress;
    gamificationRef.current = localGamification;
    pendingSyncRef.current = localPendingSync;
    setUserProgress(localProgress);
    setGamification(localGamification);

    // 2. Guest user (targetUserId === null)
    if (!targetUserId) {
      loadedUserIdRef.current = null;
      setIsLoading(false);
      return;
    }

    // 3. Authenticated user: remote loading is required before server writes are permitted
    const authenticatedUserId: string = targetUserId;
    loadedUserIdRef.current = undefined;
    setIsLoading(true);

    async function loadRemoteState(userId: string) {
      try {
        // Fetch lesson progress
        const { data: progressRows, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', userId);

        if (!isMounted || activeUserIdRef.current !== userId) return;

        const remoteMap: Record<string, UserLessonProgress> = {};
        if (!progressError && progressRows && progressRows.length > 0) {
          progressRows.forEach((row: any) => {
            const progressObj: UserLessonProgress = {
              lessonId: row.lesson_id,
              isCompleted: row.is_completed,
              currentStep: row.current_step,
              starsEarned: row.stars_earned,
              completedAt: row.completed_at,
            };
            remoteMap[row.lesson_id] = progressObj;

            const paired = getPairedId(row.lesson_id);
            if (paired && !remoteMap[paired]) {
              remoteMap[paired] = { ...progressObj, lessonId: paired };
            }
          });
        }

        // Fetch gamification
        const { data: gameRow, error: gameError } = await supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!isMounted || activeUserIdRef.current !== userId) return;

        // Merge remote progress over the latest in-memory progress (preserving in-flight user actions)
        const currentLocal = userProgressRef.current;
        const allLessonIds = new Set([...Object.keys(currentLocal), ...Object.keys(remoteMap)]);
        const mergedProgress: Record<string, UserLessonProgress> = {};
        const inFlightCompletions: UserLessonProgress[] = [];

        allLessonIds.forEach((id) => {
          const loc = currentLocal[id];
          const rem = remoteMap[id];
          if (loc && rem) {
            mergedProgress[id] = {
              lessonId: id,
              isCompleted: loc.isCompleted || rem.isCompleted,
              currentStep: Math.max(loc.currentStep || 0, rem.currentStep || 0),
              starsEarned: Math.max(loc.starsEarned || 0, rem.starsEarned || 0),
              completedAt: loc.completedAt || rem.completedAt,
            };
            if (loc.isCompleted && !rem.isCompleted) {
              inFlightCompletions.push(mergedProgress[id]);
            }
          } else if (loc) {
            mergedProgress[id] = loc;
            if (loc.isCompleted) {
              inFlightCompletions.push(loc);
            }
          } else if (rem) {
            mergedProgress[id] = rem;
          }
        });

        // Compute merged gamification preserving any XP earned during the in-flight loading window or pending offline sync
        let mergedGamification = gamificationRef.current;
        const isGamificationPending =
          pendingSyncRef.current.gamificationPending || inFlightCompletions.length > 0;

        if (!gameError && gameRow) {
          const xpEarnedInFlight = Math.max(0, gamificationRef.current.xp - localGamification.xp);
          const lessonsEarnedInFlight = Math.max(
            0,
            gamificationRef.current.completedLessonsCount - localGamification.completedLessonsCount
          );

          mergedGamification = {
            streak: gameRow.streak,
            xp: isGamificationPending
              ? Math.max(localGamification.xp, gamificationRef.current.xp, gameRow.xp + xpEarnedInFlight)
              : gameRow.xp + xpEarnedInFlight,
            lastActiveDate: gameRow.last_active_date || gamificationRef.current.lastActiveDate,
            completedLessonsCount: isGamificationPending
              ? Math.max(
                  localGamification.completedLessonsCount,
                  gamificationRef.current.completedLessonsCount,
                  gameRow.completed_lessons_count + lessonsEarnedInFlight
                )
              : gameRow.completed_lessons_count + lessonsEarnedInFlight,
          };
        }

        userProgressRef.current = mergedProgress;
        gamificationRef.current = mergedGamification;
        setUserProgress(mergedProgress);
        setGamification(mergedGamification);

        try {
          localStorage.setItem(getProgressStorageKey(userId), JSON.stringify(mergedProgress));
          localStorage.setItem(getGamificationStorageKey(userId), JSON.stringify(mergedGamification));
        } catch {}

        // Enqueue any in-flight completed lessons to pendingSync
        if (inFlightCompletions.length > 0 || isGamificationPending) {
          const currentPending = { ...pendingSyncRef.current };
          const updatedLessons = { ...currentPending.lessons };
          inFlightCompletions.forEach((item) => {
            updatedLessons[item.lessonId] = item;
          });
          persistPendingSync(userId, {
            ...currentPending,
            lessons: updatedLessons,
            gamificationPending: isGamificationPending,
          });
        }

        loadedUserIdRef.current = userId;

        // Flush any pending sync (offline writes or in-flight completions)
        await flushPendingSync(userId, { silent: true });
      } catch (err) {
        console.warn('[MicrolearningContext] Remote sync fallback to offline localStorage', err);
        if (isMounted && activeUserIdRef.current === userId) {
          loadedUserIdRef.current = userId;
        }
      } finally {
        if (isMounted && activeUserIdRef.current === userId) {
          setIsLoading(false);
        }
      }
    }

    loadRemoteState(authenticatedUserId);

    return () => {
      isMounted = false;
    };
  }, [currentUserId, authLoading, flushPendingSync, persistPendingSync]);

  const getLessonProgress = useCallback(
    (lessonId: string): UserLessonProgress | undefined => {
      if (userProgress[lessonId]) return userProgress[lessonId];
      const paired = getPairedId(lessonId);
      if (paired && userProgress[paired]) return userProgress[paired];
      return undefined;
    },
    [userProgress]
  );

  const getMissionProgress = useCallback(
    (missionId: string): UserLessonProgress | undefined => {
      const canonicalId = missionId.startsWith('mission-') ? missionId : `mission-${missionId}`;
      if (userProgress[canonicalId]) return userProgress[canonicalId];
      const paired = getPairedId(canonicalId);
      if (paired && userProgress[paired]) return userProgress[paired];
      return undefined;
    },
    [userProgress]
  );

  const isMissionUnlocked = useCallback(
    (missionId: string): boolean => {
      const canonicalId = missionId.startsWith('mission-') ? missionId : `mission-${missionId}`;
      const allMissions = getAllMissions();
      const index = allMissions.findIndex((m) => m.id === canonicalId || `mission-${m.order}` === canonicalId);
      if (index <= 0) return true; // First mission is always unlocked

      const prevMission = allMissions[index - 1];
      const prevProgress =
        userProgress[prevMission.id] ||
        (prevMission.order ? userProgress[`mission-${prevMission.order}`] : undefined) ||
        (prevMission.order ? userProgress[`les-${prevMission.order}`] : undefined);

      return !!prevProgress?.isCompleted;
    },
    [userProgress]
  );

  const isLessonUnlocked = useCallback(
    (lessonId: string): boolean => {
      if (lessonId.startsWith('mission-')) {
        return isMissionUnlocked(lessonId);
      }
      const allLessons = getAllTier1Lessons();
      const index = allLessons.findIndex((l) => l.id === lessonId);
      if (index <= 0) return true; // First lesson is always unlocked

      const currentLesson = allLessons[index];
      if (currentLesson.prerequisiteLessonId) {
        const prereq = currentLesson.prerequisiteLessonId;
        const paired = getPairedId(prereq);
        return !!userProgress[prereq]?.isCompleted || (paired ? !!userProgress[paired]?.isCompleted : false);
      }

      // Default: Previous lesson must be completed
      const previousLesson = allLessons[index - 1];
      const pairedPrev = getPairedId(previousLesson.id);
      return !!userProgress[previousLesson.id]?.isCompleted || (pairedPrev ? !!userProgress[pairedPrev]?.isCompleted : false);
    },
    [userProgress, isMissionUnlocked]
  );

  const updateStepProgress = useCallback(
    async (lessonId: string, stepNumber: number) => {
      const activeUser = activeUserIdRef.current;
      const paired = getPairedId(lessonId);

      const prev = userProgressRef.current;
      const existing = prev[lessonId] || (paired ? prev[paired] : undefined);
      const nextRecord: UserLessonProgress = {
        lessonId,
        isCompleted: existing?.isCompleted || false,
        currentStep: Math.max(existing?.currentStep || 0, stepNumber),
        starsEarned: existing?.starsEarned || 0,
        completedAt: existing?.completedAt,
      };

      const nextState = {
        ...prev,
        [lessonId]: nextRecord,
        ...(paired ? { [paired]: { ...nextRecord, lessonId: paired } } : {}),
      };

      userProgressRef.current = nextState;
      setUserProgress(nextState);

      try {
        localStorage.setItem(getProgressStorageKey(activeUser), JSON.stringify(nextState));
      } catch {}

      if (!activeUser) {
        return;
      }

      // Add to pending sync queue
      const currentPending = pendingSyncRef.current;
      persistPendingSync(activeUser, {
        ...currentPending,
        lessons: {
          ...currentPending.lessons,
          [lessonId]: nextRecord,
        },
      });

      // Prevent server write until the correct user's remote state is loaded
      if (loadedUserIdRef.current !== activeUser) {
        return;
      }

      await flushPendingSync(activeUser);
    },
    [flushPendingSync, persistPendingSync]
  );

  const updateMissionStepProgress = useCallback(
    async (missionId: string, stepNumber: number) => {
      const canonicalId = missionId.startsWith('mission-') ? missionId : `mission-${missionId}`;
      await updateStepProgress(canonicalId, stepNumber);
    },
    [updateStepProgress]
  );

  const completeLesson = useCallback(
    async (lessonId: string, stars: number, xpReward: number) => {
      const activeUser = activeUserIdRef.current;
      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];
      const paired = getPairedId(lessonId);

      // 1. Optimistic synchronous update of user progress in memory and user-scoped localStorage
      const prevProg = userProgressRef.current;
      const existing = prevProg[lessonId] || (paired ? prevProg[paired] : undefined);
      const isFirstCompletion = !existing?.isCompleted;

      const nextRecord: UserLessonProgress = {
        lessonId,
        isCompleted: true,
        currentStep: Math.max(existing?.currentStep || 0, 100),
        starsEarned: Math.max(existing?.starsEarned || 0, stars),
        completedAt: existing?.completedAt || nowIso,
      };

      const nextProgState = {
        ...prevProg,
        [lessonId]: nextRecord,
        ...(paired ? { [paired]: { ...nextRecord, lessonId: paired } } : {}),
      };

      userProgressRef.current = nextProgState;
      setUserProgress(nextProgState);

      try {
        localStorage.setItem(getProgressStorageKey(activeUser), JSON.stringify(nextProgState));
      } catch {}

      // 2. Synchronous optimistic computation of gamification (streak & XP)
      const prevGame = gamificationRef.current;
      const lastDate = prevGame.lastActiveDate;
      let nextStreak = prevGame.streak;

      if (lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (lastDate === yesterday) {
          nextStreak += 1;
        } else {
          nextStreak = 1;
        }
      }

      const nextGame: UserGamificationState = {
        streak: nextStreak,
        xp: isFirstCompletion ? prevGame.xp + xpReward : prevGame.xp,
        lastActiveDate: today,
        completedLessonsCount: isFirstCompletion
          ? prevGame.completedLessonsCount + 1
          : prevGame.completedLessonsCount,
      };

      gamificationRef.current = nextGame;
      setGamification(nextGame);

      try {
        localStorage.setItem(getGamificationStorageKey(activeUser), JSON.stringify(nextGame));
      } catch {}

      if (!activeUser) {
        return;
      }

      // Add to pending sync queue
      const currentPending = pendingSyncRef.current;
      persistPendingSync(activeUser, {
        ...currentPending,
        lessons: {
          ...currentPending.lessons,
          [lessonId]: nextRecord,
        },
        gamificationPending: true,
      });

      // Prevent server write until the correct user's remote state is loaded
      if (loadedUserIdRef.current !== activeUser) {
        return;
      }

      await flushPendingSync(activeUser);
    },
    [flushPendingSync, persistPendingSync]
  );

  const completeMission = useCallback(
    async (missionId: string, stars: number, xpReward: number) => {
      const canonicalId = missionId.startsWith('mission-') ? missionId : `mission-${missionId}`;
      await completeLesson(canonicalId, stars, xpReward);
    },
    [completeLesson]
  );

  const resetProgress = useCallback(() => {
    const activeUser = activeUserIdRef.current;
    try {
      localStorage.removeItem(getProgressStorageKey(activeUser));
      localStorage.removeItem(getGamificationStorageKey(activeUser));
      localStorage.removeItem(getPendingSyncStorageKey(activeUser));
    } catch {}
    userProgressRef.current = {};
    gamificationRef.current = DEFAULT_GAMIFICATION;
    pendingSyncRef.current = { lessons: {}, gamificationPending: false };
    setUserProgress({});
    setGamification(DEFAULT_GAMIFICATION);
    setSyncError(null);
  }, []);

  return (
    <MicrolearningContext.Provider
      value={{
        userProgress,
        gamification,
        isLoading,
        syncError,
        retrySync,
        getLessonProgress,
        isLessonUnlocked,
        updateStepProgress,
        completeLesson,
        getMissionProgress,
        isMissionUnlocked,
        updateMissionStepProgress,
        completeMission,
        resetProgress,
      }}
    >
      {children}
    </MicrolearningContext.Provider>
  );
};

export const useMicrolearning = () => {
  const context = useContext(MicrolearningContext);
  if (!context) {
    throw new Error('useMicrolearning must be used within a MicrolearningProvider');
  }
  return context;
};

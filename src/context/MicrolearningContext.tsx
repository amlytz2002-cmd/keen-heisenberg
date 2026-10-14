import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserLessonProgress, UserGamificationState } from '../types/microlearning';
import { getAllTier1Lessons } from '../data/courses/medicinalChemistryTier1';
import { getAllMissions } from '../data/courses/medicinalChemistryMissions';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface MicrolearningContextType {
  userProgress: Record<string, UserLessonProgress>;
  gamification: UserGamificationState;
  isLoading: boolean;
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

  // Synchronous refs to guarantee atomic state computation across concurrent ticks
  const userProgressRef = useRef<Record<string, UserLessonProgress>>({});
  const gamificationRef = useRef<UserGamificationState>(DEFAULT_GAMIFICATION);

  // Guards against server writes until the active user's remote state is fully loaded
  const loadedUserIdRef = useRef<string | null | undefined>(undefined);
  const activeUserIdRef = useRef<string | null>(currentUserId);
  activeUserIdRef.current = currentUserId;

  // Reload progress when authentication identity changes
  useEffect(() => {
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

    userProgressRef.current = localProgress;
    gamificationRef.current = localGamification;
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

        // Compute merged gamification preserving any XP earned during the in-flight loading window
        let mergedGamification = gamificationRef.current;
        if (!gameError && gameRow) {
          const xpEarnedInFlight = Math.max(0, gamificationRef.current.xp - localGamification.xp);
          const lessonsEarnedInFlight = Math.max(
            0,
            gamificationRef.current.completedLessonsCount - localGamification.completedLessonsCount
          );

          mergedGamification = {
            streak: gameRow.streak,
            xp: gameRow.xp + xpEarnedInFlight,
            lastActiveDate: gameRow.last_active_date || gamificationRef.current.lastActiveDate,
            completedLessonsCount: gameRow.completed_lessons_count + lessonsEarnedInFlight,
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

        loadedUserIdRef.current = userId;

        // Sync any in-flight completed lessons to Supabase now that remote loading is complete
        if (inFlightCompletions.length > 0) {
          try {
            for (const item of inFlightCompletions) {
              await supabase
                .from('user_lesson_progress')
                .upsert(
                  {
                    user_id: userId,
                    lesson_id: item.lessonId,
                    is_completed: item.isCompleted,
                    stars_earned: item.starsEarned,
                    completed_at: item.completedAt || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id,lesson_id' }
                );
            }

            await supabase
              .from('user_gamification')
              .upsert({
                user_id: userId,
                streak: mergedGamification.streak,
                xp: mergedGamification.xp,
                last_active_date: mergedGamification.lastActiveDate,
                completed_lessons_count: mergedGamification.completedLessonsCount,
                updated_at: new Date().toISOString(),
              });
          } catch {
            // safe offline tolerance
          }
        }
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
  }, [currentUserId, authLoading]);

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

      // Prevent any server write until the correct user's progress has finished loading (Rule 5 & 6)
      if (!activeUser || loadedUserIdRef.current !== activeUser) {
        return;
      }

      // Background sync to Supabase for the authenticated user
      try {
        await supabase.from('user_lesson_progress').upsert(
          {
            user_id: activeUser,
            lesson_id: lessonId,
            current_step: stepNumber,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        );
      } catch {
        // Safe offline tolerance
      }
    },
    []
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

      // 3. Asynchronous background sync to Supabase
      // CRITICAL: Prevent any server write until the correct user's progress has finished loading (Rule 5 & 6)
      if (!activeUser || loadedUserIdRef.current !== activeUser) {
        return;
      }

      try {
        await supabase
          .from('user_lesson_progress')
          .upsert(
            {
              user_id: activeUser,
              lesson_id: lessonId,
              is_completed: true,
              stars_earned: nextRecord.starsEarned,
              completed_at: nextRecord.completedAt,
              updated_at: nowIso,
            },
            { onConflict: 'user_id,lesson_id' }
          );

        await supabase
          .from('user_gamification')
          .upsert({
            user_id: activeUser,
            streak: nextGame.streak,
            xp: nextGame.xp,
            last_active_date: today,
            completed_lessons_count: nextGame.completedLessonsCount,
            updated_at: nowIso,
          });
      } catch {
        // Safe offline tolerance
      }
    },
    []
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
    } catch {}
    userProgressRef.current = {};
    gamificationRef.current = DEFAULT_GAMIFICATION;
    setUserProgress({});
    setGamification(DEFAULT_GAMIFICATION);
  }, []);

  return (
    <MicrolearningContext.Provider
      value={{
        userProgress,
        gamification,
        isLoading,
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

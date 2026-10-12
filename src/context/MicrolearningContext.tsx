import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserLessonProgress, UserGamificationState } from '../types/microlearning';
import { getAllTier1Lessons } from '../data/courses/medicinalChemistryTier1';
import { getAllMissions } from '../data/courses/medicinalChemistryMissions';
import { supabase } from '../lib/supabaseClient';

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

const LOCAL_STORAGE_PROGRESS_KEY = 'cenna_microlearning_progress_v1';
const LOCAL_STORAGE_GAMIFICATION_KEY = 'cenna_microlearning_gamification_v1';

const DEFAULT_GAMIFICATION: UserGamificationState = {
  streak: 3, // Initial starter streak for high student motivation
  xp: 120,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedLessonsCount: 0,
};

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
  const [userProgress, setUserProgress] = useState<Record<string, UserLessonProgress>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const [gamification, setGamification] = useState<UserGamificationState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GAMIFICATION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_GAMIFICATION;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load progress from Supabase if authenticated, falling back to localStorage
  useEffect(() => {
    let isMounted = true;

    async function loadRemoteState() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // 1. Fetch lesson progress
        const { data: progressRows, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id);

        if (!progressError && progressRows && progressRows.length > 0 && isMounted) {
          const map: Record<string, UserLessonProgress> = {};
          progressRows.forEach((row: any) => {
            const progressObj: UserLessonProgress = {
              lessonId: row.lesson_id,
              isCompleted: row.is_completed,
              currentStep: row.current_step,
              starsEarned: row.stars_earned,
              completedAt: row.completed_at,
            };
            map[row.lesson_id] = progressObj;

            // Also map paired id
            const paired = getPairedId(row.lesson_id);
            if (paired && !map[paired]) {
              map[paired] = { ...progressObj, lessonId: paired };
            }
          });

          setUserProgress((prev) => {
            const merged = { ...prev, ...map };
            try {
              localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        // 2. Fetch gamification
        const { data: gameRow, error: gameError } = await supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!gameError && gameRow && isMounted) {
          const loadedGame: UserGamificationState = {
            streak: gameRow.streak,
            xp: gameRow.xp,
            lastActiveDate: gameRow.last_active_date,
            completedLessonsCount: gameRow.completed_lessons_count,
          };
          setGamification(loadedGame);
          try {
            localStorage.setItem(LOCAL_STORAGE_GAMIFICATION_KEY, JSON.stringify(loadedGame));
          } catch {}
        }
      } catch (err) {
        console.warn('[MicrolearningContext] Remote sync fallback to offline localStorage', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRemoteState();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const paired = getPairedId(lessonId);

      setUserProgress((prev) => {
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

        try {
          localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(nextState));
        } catch {}
        return nextState;
      });

      // Background sync to Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_lesson_progress').upsert(
            {
              user_id: user.id,
              lesson_id: lessonId,
              current_step: stepNumber,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,lesson_id' }
          );
        }
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
      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];
      const paired = getPairedId(lessonId);

      // 1. Optimistic synchronous update of user progress in memory and localStorage
      setUserProgress((prev) => {
        const existing = prev[lessonId] || (paired ? prev[paired] : undefined);
        const nextRecord: UserLessonProgress = {
          lessonId,
          isCompleted: true,
          currentStep: Math.max(existing?.currentStep || 0, 100),
          starsEarned: Math.max(existing?.starsEarned || 0, stars),
          completedAt: nowIso,
        };

        const nextState = {
          ...prev,
          [lessonId]: nextRecord,
          ...(paired ? { [paired]: { ...nextRecord, lessonId: paired } } : {}),
        };

        try {
          localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(nextState));
        } catch {}
        return nextState;
      });

      // 2. Optimistic update of gamification (streak & XP)
      setGamification((prev) => {
        const lastDate = prev.lastActiveDate;
        let nextStreak = prev.streak;

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
          xp: prev.xp + xpReward,
          lastActiveDate: today,
          completedLessonsCount: prev.completedLessonsCount + 1,
        };

        try {
          localStorage.setItem(LOCAL_STORAGE_GAMIFICATION_KEY, JSON.stringify(nextGame));
        } catch {}

        // 3. Asynchronous background sync to Supabase
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase
              .from('user_lesson_progress')
              .upsert(
                {
                  user_id: user.id,
                  lesson_id: lessonId,
                  is_completed: true,
                  stars_earned: stars,
                  completed_at: nowIso,
                  updated_at: nowIso,
                },
                { onConflict: 'user_id,lesson_id' }
              )
              .then(() => {});

            supabase
              .from('user_gamification')
              .upsert({
                user_id: user.id,
                streak: nextStreak,
                xp: nextGame.xp,
                last_active_date: today,
                completed_lessons_count: nextGame.completedLessonsCount,
                updated_at: nowIso,
              })
              .then(() => {});
          }
        }).catch(() => {});

        return nextGame;
      });
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
    localStorage.removeItem(LOCAL_STORAGE_PROGRESS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_GAMIFICATION_KEY);
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

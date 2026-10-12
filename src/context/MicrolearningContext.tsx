import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserLessonProgress, UserGamificationState } from '../types/microlearning';
import { getAllTier1Lessons } from '../data/courses/medicinalChemistryTier1';
import { supabase } from '../lib/supabaseClient';

interface MicrolearningContextType {
  userProgress: Record<string, UserLessonProgress>;
  gamification: UserGamificationState;
  isLoading: boolean;
  getLessonProgress: (lessonId: string) => UserLessonProgress | undefined;
  isLessonUnlocked: (lessonId: string) => boolean;
  updateStepProgress: (lessonId: string, stepNumber: number) => Promise<void>;
  completeLesson: (lessonId: string, stars: number, xpReward: number) => Promise<void>;
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
            map[row.lesson_id] = {
              lessonId: row.lesson_id,
              isCompleted: row.is_completed,
              currentStep: row.current_step,
              starsEarned: row.stars_earned,
              completedAt: row.completed_at,
            };
          });
          setUserProgress((prev) => {
            const merged = { ...prev, ...map };
            localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(merged));
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
          localStorage.setItem(LOCAL_STORAGE_GAMIFICATION_KEY, JSON.stringify(loadedGame));
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
    (lessonId: string) => {
      return userProgress[lessonId];
    },
    [userProgress]
  );

  const isLessonUnlocked = useCallback(
    (lessonId: string): boolean => {
      const allLessons = getAllTier1Lessons();
      const index = allLessons.findIndex((l) => l.id === lessonId);
      if (index <= 0) return true; // First lesson is always unlocked

      const currentLesson = allLessons[index];
      if (currentLesson.prerequisiteLessonId) {
        return !!userProgress[currentLesson.prerequisiteLessonId]?.isCompleted;
      }

      // Default: Previous lesson must be completed
      const previousLesson = allLessons[index - 1];
      return !!userProgress[previousLesson.id]?.isCompleted;
    },
    [userProgress]
  );

  const updateStepProgress = useCallback(
    async (lessonId: string, stepNumber: number) => {
      setUserProgress((prev) => {
        const existing = prev[lessonId];
        const nextState = {
          ...prev,
          [lessonId]: {
            lessonId,
            isCompleted: existing?.isCompleted || false,
            currentStep: Math.max(existing?.currentStep || 0, stepNumber),
            starsEarned: existing?.starsEarned || 0,
            completedAt: existing?.completedAt,
          },
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

  const completeLesson = useCallback(
    async (lessonId: string, stars: number, xpReward: number) => {
      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];

      // Update progress state
      setUserProgress((prev) => {
        const existing = prev[lessonId];
        const nextState = {
          ...prev,
          [lessonId]: {
            lessonId,
            isCompleted: true,
            currentStep: Math.max(existing?.currentStep || 0, 100),
            starsEarned: Math.max(existing?.starsEarned || 0, stars),
            completedAt: nowIso,
          },
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(nextState));
        } catch {}
        return nextState;
      });

      // Update gamification (streak & XP)
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

        // Async sync to Supabase
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

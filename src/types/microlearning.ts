export type StepType = 'reveal' | 'challenge' | 'synthesis' | 'clinical_apply';

export type InteractiveWidgetType =
  | 'molecule_inspector'
  | 'sar_slider'
  | 'bond_matcher'
  | 'ph_gauge'
  | 'multiple_choice';

export interface StepOption {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
}

export interface LessonStep {
  id: string;
  stepNumber: number;
  type: StepType;
  title: string;
  conceptTag: string;
  instructionHtml: string;
  widgetType: InteractiveWidgetType;
  widgetProps: Record<string, any>;
  options?: StepOption[];
  correctAnswer: any;
  explanationHtml: string;
  clinicalPearl?: string;
  socraticHintChain: [string, string, string]; // 3-aşamalı Sokratik ipucu zinciri
}

export interface MicroLesson {
  id: string;
  moduleId: string;
  lessonNumber: number;
  title: string;
  subtitle: string;
  durationMinutes: number;
  xpReward: number;
  iconName: string;
  prerequisiteLessonId?: string;
  steps: LessonStep[];
}

export interface CourseModule {
  id: string;
  tier: 1 | 2 | 3;
  moduleNumber: number;
  title: string;
  shortDescription: string;
  badgeText: string;
  colorTheme: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan';
  lessons: MicroLesson[];
}

export interface UserLessonProgress {
  lessonId: string;
  isCompleted: boolean;
  currentStep: number;
  starsEarned: number;
  completedAt?: string;
}

export interface UserGamificationState {
  streak: number;
  xp: number;
  lastActiveDate: string | null;
  completedLessonsCount: number;
}

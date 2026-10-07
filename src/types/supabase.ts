export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attempts: {
        Row: {
          assisted: boolean | null
          changed_answer: boolean | null
          confidence: number
          created_at: string | null
          hint_level: number | null
          id: string
          is_correct: boolean
          item_id: string | null
          latency_ms: number
          submitted_answer: string
          user_id: string
        }
        Insert: {
          assisted?: boolean | null
          changed_answer?: boolean | null
          confidence: number
          created_at?: string | null
          hint_level?: number | null
          id?: string
          is_correct: boolean
          item_id?: string | null
          latency_ms: number
          submitted_answer: string
          user_id: string
        }
        Update: {
          assisted?: boolean | null
          changed_answer?: boolean | null
          confidence?: number
          created_at?: string | null
          hint_level?: number | null
          id?: string
          is_correct?: boolean
          item_id?: string | null
          latency_ms?: number
          submitted_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_edges: {
        Row: {
          edge_type: string
          id: string
          source_concept_id: string | null
          target_concept_id: string | null
        }
        Insert: {
          edge_type: string
          id?: string
          source_concept_id?: string | null
          target_concept_id?: string | null
        }
        Update: {
          edge_type?: string
          id?: string
          source_concept_id?: string | null
          target_concept_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concept_edges_source_concept_id_fkey"
            columns: ["source_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_edges_target_concept_id_fkey"
            columns: ["target_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          canonical_name: string
          course_id: string | null
          created_at: string | null
          id: string
          pillar: string
          slug: string
          syllabus_weight: number | null
        }
        Insert: {
          canonical_name: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          pillar: string
          slug: string
          syllabus_weight?: number | null
        }
        Update: {
          canonical_name?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          pillar?: string
          slug?: string
          syllabus_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "concepts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string | null
          faculty: string | null
          id: string
          is_active: boolean | null
          language: string | null
          name: string
          term: string
          year: number
        }
        Insert: {
          code: string
          created_at?: string | null
          faculty?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name: string
          term: string
          year?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          faculty?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name?: string
          term?: string
          year?: number
        }
        Relationships: []
      }
      distractors: {
        Row: {
          id: string
          item_id: string | null
          misconception_tag: string
          option_key: string
          text_tr: string
        }
        Insert: {
          id?: string
          item_id?: string | null
          misconception_tag: string
          option_key: string
          text_tr: string
        }
        Update: {
          id?: string
          item_id?: string | null
          misconception_tag?: string
          option_key?: string
          text_tr?: string
        }
        Relationships: [
          {
            foreignKeyName: "distractors_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          amount_paid: number
          auto_renew: boolean
          billing_cycle: string
          course_id: string
          currency: string
          entitlement_id: string
          entitlements: string[]
          expires_at: string
          gateway_order_id: string | null
          gateway_subscription_id: string | null
          id: string
          payment_gateway: string
          plan: string
          plan_id: string
          revoked_at: string | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          auto_renew?: boolean
          billing_cycle: string
          course_id: string
          currency?: string
          entitlement_id: string
          entitlements?: string[]
          expires_at: string
          gateway_order_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          payment_gateway?: string
          plan: string
          plan_id: string
          revoked_at?: string | null
          started_at?: string
          status: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          auto_renew?: boolean
          billing_cycle?: string
          course_id?: string
          currency?: string
          entitlement_id?: string
          entitlements?: string[]
          expires_at?: string
          gateway_order_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          payment_gateway?: string
          plan?: string
          plan_id?: string
          revoked_at?: string | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_events: {
        Row: {
          attempt_id: string | null
          concept_id: string | null
          confidence: number
          created_at: string | null
          error_family: string
          failed_node: string | null
          id: string
          is_correct: boolean
          is_hypercorrection: boolean | null
          misconception_tag: string
          resolved: boolean | null
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          concept_id?: string | null
          confidence?: number
          created_at?: string | null
          error_family: string
          failed_node?: string | null
          id?: string
          is_correct?: boolean
          is_hypercorrection?: boolean | null
          misconception_tag: string
          resolved?: boolean | null
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          concept_id?: string | null
          confidence?: number
          created_at?: string | null
          error_family?: string
          failed_node?: string | null
          id?: string
          is_correct?: boolean
          is_hypercorrection?: boolean | null
          misconception_tag?: string
          resolved?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_events_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          concept_id: string | null
          correct_key: string
          created_at: string | null
          difficulty_tier: number | null
          id: string
          item_type: string
          origin: string | null
          review_status: string | null
          source_ref: string
          stem_tr: string
          tolerance_pct: number | null
        }
        Insert: {
          concept_id?: string | null
          correct_key: string
          created_at?: string | null
          difficulty_tier?: number | null
          id?: string
          item_type?: string
          origin?: string | null
          review_status?: string | null
          source_ref: string
          stem_tr: string
          tolerance_pct?: number | null
        }
        Update: {
          concept_id?: string | null
          correct_key?: string
          created_at?: string | null
          difficulty_tier?: number | null
          id?: string
          item_type?: string
          origin?: string | null
          review_status?: string | null
          source_ref?: string
          stem_tr?: string
          tolerance_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_courses: {
        Row: {
          banner_asset: string | null
          description: string | null
          estimated_hours: number
          free_lessons_per_module: number
          id: string
          modules_count: number
          published: boolean
          slug: string
          title: string
          total_lessons: number
          updated_at: string
        }
        Insert: {
          banner_asset?: string | null
          description?: string | null
          estimated_hours?: number
          free_lessons_per_module?: number
          id: string
          modules_count?: number
          published?: boolean
          slug: string
          title: string
          total_lessons?: number
          updated_at?: string
        }
        Update: {
          banner_asset?: string | null
          description?: string | null
          estimated_hours?: number
          free_lessons_per_module?: number
          id?: string
          modules_count?: number
          published?: boolean
          slug?: string
          title?: string
          total_lessons?: number
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          course_id: string
          estimated_minutes: number
          id: string
          is_free_preview: boolean
          module_id: string
          order_index_in_module: number
          published: boolean
          sources: Json
          step_count: number
          summary: string | null
          title: string
        }
        Insert: {
          course_id: string
          estimated_minutes?: number
          id: string
          is_free_preview?: boolean
          module_id: string
          order_index_in_module: number
          published?: boolean
          sources?: Json
          step_count?: number
          summary?: string | null
          title: string
        }
        Update: {
          course_id?: string
          estimated_minutes?: number
          id?: string
          is_free_preview?: boolean
          module_id?: string
          order_index_in_module?: number
          published?: boolean
          sources?: Json
          step_count?: number
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "legacy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_usage: {
        Row: {
          cost_est_usd: number
          created_at: string | null
          id: string
          route: string
          tokens_in: number
          tokens_out: number
          user_id: string
        }
        Insert: {
          cost_est_usd: number
          created_at?: string | null
          id?: string
          route: string
          tokens_in: number
          tokens_out: number
          user_id: string
        }
        Update: {
          cost_est_usd?: number
          created_at?: string | null
          id?: string
          route?: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          id: string
          learning_objectives: string[] | null
          order_index: number
          prerequisites: string[] | null
          summary: string | null
          title: string
        }
        Insert: {
          course_id: string
          id: string
          learning_objectives?: string[] | null
          order_index: number
          prerequisites?: string[] | null
          summary?: string | null
          title: string
        }
        Update: {
          course_id?: string
          id?: string
          learning_objectives?: string[] | null
          order_index?: number
          prerequisites?: string[] | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "legacy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      next_time_rules: {
        Row: {
          concept_id: string | null
          created_at: string | null
          edited_by_user: boolean | null
          id: string
          last_shown: string | null
          misconception_tag: string
          rule_text_tr: string
          times_shown: number | null
          user_id: string
        }
        Insert: {
          concept_id?: string | null
          created_at?: string | null
          edited_by_user?: boolean | null
          id?: string
          last_shown?: string | null
          misconception_tag: string
          rule_text_tr: string
          times_shown?: number | null
          user_id: string
        }
        Update: {
          concept_id?: string | null
          created_at?: string | null
          edited_by_user?: boolean | null
          id?: string
          last_shown?: string | null
          misconception_tag?: string
          rule_text_tr?: string
          times_shown?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "next_time_rules_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_year: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          last_active_at: string
          learning_track: string | null
          onboarding_completed: boolean | null
          plan: string
          preferred_language: string
          trial_ends_at: string | null
          trial_started_at: string | null
          trial_used: boolean
          university: string | null
        }
        Insert: {
          academic_year?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          last_active_at?: string
          learning_track?: string | null
          onboarding_completed?: boolean | null
          plan?: string
          preferred_language?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_used?: boolean
          university?: string | null
        }
        Update: {
          academic_year?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          last_active_at?: string
          learning_track?: string | null
          onboarding_completed?: boolean | null
          plan?: string
          preferred_language?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_used?: boolean
          university?: string | null
        }
        Relationships: []
      }
      review_schedule: {
        Row: {
          difficulty: number | null
          due_at: string | null
          id: string
          item_id: string | null
          last_reviewed: string | null
          stability: number | null
          user_id: string
        }
        Insert: {
          difficulty?: number | null
          due_at?: string | null
          id?: string
          item_id?: string | null
          last_reviewed?: string | null
          stability?: number | null
          user_id: string
        }
        Update: {
          difficulty?: number | null
          due_at?: string | null
          id?: string
          item_id?: string | null
          last_reviewed?: string | null
          stability?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_schedule_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      spaced_repetition: {
        Row: {
          box: number
          card_id: string
          course_id: string
          drug_or_concept: string
          history: Json
          id: string
          interval_days: number
          lapse_count: number
          last_reviewed_at: string
          next_review_due: string
          review_count: number
          user_id: string
        }
        Insert: {
          box?: number
          card_id: string
          course_id: string
          drug_or_concept: string
          history?: Json
          id?: string
          interval_days?: number
          lapse_count?: number
          last_reviewed_at?: string
          next_review_due?: string
          review_count?: number
          user_id: string
        }
        Update: {
          box?: number
          card_id?: string
          course_id?: string
          drug_or_concept?: string
          history?: Json
          id?: string
          interval_days?: number
          lapse_count?: number
          last_reviewed_at?: string
          next_review_due?: string
          review_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaced_repetition_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "legacy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaced_repetition_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      steps: {
        Row: {
          correct_answer: Json
          course_id: string
          explanation: string
          hints: Json
          id: string
          interaction_type: string
          is_free_preview: boolean
          lesson_id: string
          misconception_feedback: Json
          order_index: number
          pedagogical_type: string
          prompt: string
          sources: Json
          widget_config: Json
        }
        Insert: {
          correct_answer: Json
          course_id: string
          explanation: string
          hints?: Json
          id: string
          interaction_type: string
          is_free_preview?: boolean
          lesson_id: string
          misconception_feedback?: Json
          order_index: number
          pedagogical_type: string
          prompt: string
          sources?: Json
          widget_config?: Json
        }
        Update: {
          correct_answer?: Json
          course_id?: string
          explanation?: string
          hints?: Json
          id?: string
          interaction_type?: string
          is_free_preview?: boolean
          lesson_id?: string
          misconception_feedback?: Json
          order_index?: number
          pedagogical_type?: string
          prompt?: string
          sources?: Json
          widget_config?: Json
        }
        Relationships: [
          {
            foreignKeyName: "steps_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "legacy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "steps_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          activated_manually_by: string | null
          created_at: string | null
          current_period_end: string
          id: string
          period: string
          status: string
          tier: string
          user_id: string
        }
        Insert: {
          activated_manually_by?: string | null
          created_at?: string | null
          current_period_end: string
          id?: string
          period?: string
          status?: string
          tier?: string
          user_id: string
        }
        Update: {
          activated_manually_by?: string | null
          created_at?: string | null
          current_period_end?: string
          id?: string
          period?: string
          status?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mastery: {
        Row: {
          concept_id: string | null
          id: string
          last_updated: string | null
          mastery_score: number | null
          user_id: string
        }
        Insert: {
          concept_id?: string | null
          id?: string
          last_updated?: string | null
          mastery_score?: number | null
          user_id: string
        }
        Update: {
          concept_id?: string | null
          id?: string
          last_updated?: string | null
          mastery_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mastery_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          accuracy_rate: number
          completed_lesson_ids: string[]
          course_id: string
          current_lesson_id: string | null
          current_module_id: string | null
          current_step_index: number
          id: string
          last_streak_date: string | null
          streak_days: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_rate?: number
          completed_lesson_ids?: string[]
          course_id: string
          current_lesson_id?: string | null
          current_module_id?: string | null
          current_step_index?: number
          id?: string
          last_streak_date?: string | null
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_rate?: number
          completed_lesson_ids?: string[]
          course_id?: string
          current_lesson_id?: string | null
          current_module_id?: string | null
          current_step_index?: number
          id?: string
          last_streak_date?: string | null
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "legacy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      start_free_trial: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

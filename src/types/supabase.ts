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
      ai_generation_runs: {
        Row: {
          completed_at: string | null
          course_id: string | null
          created_at: string | null
          created_content_id: string | null
          id: string
          model_identifier: string
          prompt_version: string
          requested_by: string | null
          resource_id: string | null
          status: string
          task_type: string
          validation_result: Json | null
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          created_content_id?: string | null
          id?: string
          model_identifier: string
          prompt_version: string
          requested_by?: string | null
          resource_id?: string | null
          status?: string
          task_type: string
          validation_result?: Json | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          created_content_id?: string | null
          id?: string
          model_identifier?: string
          prompt_version?: string
          requested_by?: string | null
          resource_id?: string | null
          status?: string
          task_type?: string
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_runs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_runs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
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
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      classroom_invitations: {
        Row: {
          classroom_id: string
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          max_uses: number | null
          revoked_at: string | null
          token_hash: string
          use_count: number
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          token_hash: string
          use_count?: number
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          token_hash?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "classroom_invitations_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_members: {
        Row: {
          classroom_id: string
          id: string
          joined_at: string
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          classroom_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string | null
          user_id: string
        }
        Update: {
          classroom_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_members_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          blueprint_id: string | null
          course_code: string
          created_at: string
          created_by: string | null
          description: string | null
          exam_date: string | null
          id: string
          is_active: boolean
          join_code: string
          name: string | null
          owner_id: string | null
          section_code: string | null
          settings: Json
          status: string | null
          term: string
          title: string
          updated_at: string | null
        }
        Insert: {
          blueprint_id?: string | null
          course_code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_date?: string | null
          id?: string
          is_active?: boolean
          join_code: string
          name?: string | null
          owner_id?: string | null
          section_code?: string | null
          settings?: Json
          status?: string | null
          term: string
          title: string
          updated_at?: string | null
        }
        Update: {
          blueprint_id?: string | null
          course_code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_date?: string | null
          id?: string
          is_active?: boolean
          join_code?: string
          name?: string | null
          owner_id?: string | null
          section_code?: string | null
          settings?: Json
          status?: string | null
          term?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      concept_relations: {
        Row: {
          concept_id: string
          id: string
          related_concept_id: string
          relation_type: string
        }
        Insert: {
          concept_id: string
          id?: string
          related_concept_id: string
          relation_type: string
        }
        Update: {
          concept_id?: string
          id?: string
          related_concept_id?: string
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_relations_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_relations_related_concept_id_fkey"
            columns: ["related_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_sources: {
        Row: {
          chunk_id: string | null
          citation_text: string | null
          concept_id: string
          created_at: string | null
          id: string
          page_number: number | null
          resource_id: string
        }
        Insert: {
          chunk_id?: string | null
          citation_text?: string | null
          concept_id: string
          created_at?: string | null
          id?: string
          page_number?: number | null
          resource_id: string
        }
        Update: {
          chunk_id?: string | null
          citation_text?: string | null
          concept_id?: string
          created_at?: string | null
          id?: string
          page_number?: number | null
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_sources_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "resource_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_sources_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_sources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          approved_by: string | null
          canonical_name: string
          course_id: string | null
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          module_id: string | null
          pillar: string
          published_at: string | null
          slug: string
          status: string | null
          summary: string | null
          syllabus_weight: number | null
          title: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          approved_by?: string | null
          canonical_name: string
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          module_id?: string | null
          pillar: string
          published_at?: string | null
          slug: string
          status?: string | null
          summary?: string | null
          syllabus_weight?: number | null
          title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          approved_by?: string | null
          canonical_name?: string
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          module_id?: string | null
          pillar?: string
          published_at?: string | null
          slug?: string
          status?: string | null
          summary?: string | null
          syllabus_weight?: number | null
          title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "concepts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          position: number
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          position?: number
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          position?: number
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          classroom_id: string | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          faculty: string | null
          id: string
          is_active: boolean | null
          language: string | null
          name: string
          status: string | null
          subject: string | null
          term: string
          title: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          classroom_id?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          faculty?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name: string
          status?: string | null
          subject?: string | null
          term: string
          title?: string | null
          updated_at?: string | null
          year?: number
        }
        Update: {
          classroom_id?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          faculty?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name?: string
          status?: string | null
          subject?: string | null
          term?: string
          title?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
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
      email_events: {
        Row: {
          created_at: string | null
          email_type: string
          id: string
          idempotency_key: string
          last_error_code: string | null
          provider_message_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          id?: string
          idempotency_key: string
          last_error_code?: string | null
          provider_message_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          id?: string
          idempotency_key?: string
          last_error_code?: string | null
          provider_message_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      exam_attempt_answers: {
        Row: {
          answer_payload: Json | null
          exam_attempt_id: string
          id: string
          is_correct: boolean | null
          points_awarded: number | null
          question_id: string
          question_version: number
          updated_at: string | null
        }
        Insert: {
          answer_payload?: Json | null
          exam_attempt_id: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number | null
          question_id: string
          question_version?: number
          updated_at?: string | null
        }
        Update: {
          answer_payload?: Json | null
          exam_attempt_id?: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number | null
          question_id?: string
          question_version?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempt_answers_exam_attempt_id_fkey"
            columns: ["exam_attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          created_at: string | null
          deadline_at: string
          exam_id: string
          id: string
          result_summary: Json | null
          score: number | null
          started_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deadline_at: string
          exam_id: string
          id?: string
          result_summary?: Json | null
          score?: number | null
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deadline_at?: string
          exam_id?: string
          id?: string
          result_summary?: Json | null
          score?: number | null
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          exam_id: string
          id: string
          points: number
          position: number
          question_id: string
        }
        Insert: {
          exam_id: string
          id?: string
          points?: number
          position?: number
          question_id: string
        }
        Update: {
          exam_id?: string
          id?: string
          points?: number
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          available_from: string | null
          available_until: string | null
          classroom_id: string | null
          course_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_seconds: number
          id: string
          max_attempts: number | null
          scoring_config: Json
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          classroom_id?: string | null
          course_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          max_attempts?: number | null
          scoring_config?: Json
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          classroom_id?: string | null
          course_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          max_attempts?: number | null
          scoring_config?: Json
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      hint_events: {
        Row: {
          hint_index: number
          hint_source: string
          id: string
          question_attempt_id: string
          requested_at: string | null
        }
        Insert: {
          hint_index: number
          hint_source?: string
          id?: string
          question_attempt_id: string
          requested_at?: string | null
        }
        Update: {
          hint_index?: number
          hint_source?: string
          id?: string
          question_attempt_id?: string
          requested_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hint_events_question_attempt_id_fkey"
            columns: ["question_attempt_id"]
            isOneToOne: false
            referencedRelation: "question_attempts"
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
      processing_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          last_error_code: string | null
          last_error_message: string | null
          resource_id: string | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type: string
          last_error_code?: string | null
          last_error_message?: string | null
          resource_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type?: string
          last_error_code?: string | null
          last_error_message?: string | null
          resource_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_year: string | null
          avatar_path: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          last_active_at: string
          learning_track: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          plan: string
          preferred_language: string
          timezone: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          trial_used: boolean
          university: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          avatar_path?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          last_active_at?: string
          learning_track?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          plan?: string
          preferred_language?: string
          timezone?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_used?: boolean
          university?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          avatar_path?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          last_active_at?: string
          learning_track?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          plan?: string
          preferred_language?: string
          timezone?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_used?: boolean
          university?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          answer_payload: Json
          feedback: Json | null
          grading_status: string
          hints_used: number
          id: string
          is_correct: boolean | null
          question_id: string
          question_version: number
          score: number | null
          study_session_id: string | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          answer_payload: Json
          feedback?: Json | null
          grading_status?: string
          hints_used?: number
          id?: string
          is_correct?: boolean | null
          question_id: string
          question_version?: number
          score?: number | null
          study_session_id?: string | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          answer_payload?: Json
          feedback?: Json | null
          grading_status?: string
          hints_used?: number
          id?: string
          is_correct?: boolean | null
          question_id?: string
          question_version?: number
          score?: number | null
          study_session_id?: string | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_study_session_id_fkey"
            columns: ["study_session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_sources: {
        Row: {
          chunk_id: string | null
          created_at: string | null
          id: string
          page_number: number | null
          question_id: string
          resource_id: string
          supporting_excerpt: string | null
        }
        Insert: {
          chunk_id?: string | null
          created_at?: string | null
          id?: string
          page_number?: number | null
          question_id: string
          resource_id: string
          supporting_excerpt?: string | null
        }
        Update: {
          chunk_id?: string | null
          created_at?: string | null
          id?: string
          page_number?: number | null
          question_id?: string
          resource_id?: string
          supporting_excerpt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_sources_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "resource_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_sources_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_sources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_key: Json
          approved_by: string | null
          concept_id: string | null
          course_id: string | null
          created_at: string | null
          created_by: string | null
          difficulty: string
          explanation: string
          hint_sequence: Json
          id: string
          options: Json | null
          published_at: string | null
          question_text: string
          question_type: string
          status: string
          updated_at: string | null
          version: number
        }
        Insert: {
          answer_key: Json
          approved_by?: string | null
          concept_id?: string | null
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string
          explanation: string
          hint_sequence?: Json
          id?: string
          options?: Json | null
          published_at?: string | null
          question_text: string
          question_type: string
          status?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          answer_key?: Json
          approved_by?: string | null
          concept_id?: string | null
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string
          explanation?: string
          hint_sequence?: Json
          id?: string
          options?: Json | null
          published_at?: string | null
          question_text?: string
          question_type?: string
          status?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          end_offset: number | null
          id: string
          page_number: number | null
          resource_id: string
          section_title: string | null
          start_offset: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          end_offset?: number | null
          id?: string
          page_number?: number | null
          resource_id: string
          section_title?: string | null
          start_offset?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          end_offset?: number | null
          id?: string
          page_number?: number | null
          resource_id?: string
          section_title?: string | null
          start_offset?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_chunks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          classroom_id: string | null
          content_hash: string | null
          course_id: string | null
          created_at: string | null
          extraction_version: string | null
          file_size_bytes: number
          id: string
          mime_type: string
          original_filename: string
          processing_error_code: string | null
          processing_error_message: string | null
          processing_status: string
          storage_path: string
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          classroom_id?: string | null
          content_hash?: string | null
          course_id?: string | null
          created_at?: string | null
          extraction_version?: string | null
          file_size_bytes: number
          id?: string
          mime_type: string
          original_filename: string
          processing_error_code?: string | null
          processing_error_message?: string | null
          processing_status?: string
          storage_path: string
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          classroom_id?: string | null
          content_hash?: string | null
          course_id?: string | null
          created_at?: string | null
          extraction_version?: string | null
          file_size_bytes?: number
          id?: string
          mime_type?: string
          original_filename?: string
          processing_error_code?: string | null
          processing_error_message?: string | null
          processing_status?: string
          storage_path?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      review_events: {
        Row: {
          concept_id: string
          created_at: string | null
          event_type: string
          id: string
          new_stage: number
          next_due_at: string | null
          previous_due_at: string | null
          previous_stage: number | null
          question_attempt_id: string | null
          user_id: string
        }
        Insert: {
          concept_id: string
          created_at?: string | null
          event_type: string
          id?: string
          new_stage: number
          next_due_at?: string | null
          previous_due_at?: string | null
          previous_stage?: number | null
          question_attempt_id?: string | null
          user_id: string
        }
        Update: {
          concept_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          new_stage?: number
          next_due_at?: string | null
          previous_due_at?: string | null
          previous_stage?: number | null
          question_attempt_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_events_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_events_question_attempt_id_fkey"
            columns: ["question_attempt_id"]
            isOneToOne: false
            referencedRelation: "question_attempts"
            referencedColumns: ["id"]
          },
        ]
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
      study_sessions: {
        Row: {
          completed_at: string | null
          course_id: string | null
          created_at: string | null
          id: string
          planned_duration_seconds: number | null
          session_type: string
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          planned_duration_seconds?: number | null
          session_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          planned_duration_seconds?: number | null
          session_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      user_concept_progress: {
        Row: {
          algorithm_version: string
          concept_id: string
          consecutive_successes: number
          correct_attempts: number
          id: string
          last_reviewed_at: string | null
          mastery_score: number
          next_review_at: string | null
          recent_performance: Json | null
          review_stage: number
          total_attempts: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          algorithm_version?: string
          concept_id: string
          consecutive_successes?: number
          correct_attempts?: number
          id?: string
          last_reviewed_at?: string | null
          mastery_score?: number
          next_review_at?: string | null
          recent_performance?: Json | null
          review_stage?: number
          total_attempts?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          algorithm_version?: string
          concept_id?: string
          consecutive_successes?: number
          correct_attempts?: number
          id?: string
          last_reviewed_at?: string | null
          mastery_score?: number
          next_review_at?: string | null
          recent_performance?: Json | null
          review_stage?: number
          total_attempts?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_concept_progress_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          completed_lessons_count: number
          created_at: string
          last_active_date: string | null
          streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          completed_lessons_count?: number
          created_at?: string
          last_active_date?: string | null
          streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          completed_lessons_count?: number
          created_at?: string
          last_active_date?: string | null
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          is_completed: boolean
          lesson_id: string
          stars_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          lesson_id: string
          stars_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          lesson_id?: string
          stars_earned?: number
          updated_at?: string
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invitation_by_token_hash: {
        Args: { p_hash: string }
        Returns: {
          classroom_description: string
          classroom_id: string
          classroom_name: string
          expires_at: string
          id: string
          max_uses: number
          revoked_at: string
          use_count: number
        }[]
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_classroom_instructor: { Args: { cid: string }; Returns: boolean }
      is_classroom_member: { Args: { cid: string }; Returns: boolean }
      is_classroom_owner: { Args: { cid: string }; Returns: boolean }
      is_instructor: { Args: { check_user_id: string }; Returns: boolean }
      redeem_classroom_invitation: {
        Args: { p_hash: string; p_user_id: string }
        Returns: Json
      }
      sync_lesson_progress: {
        Args: {
          p_completed_at?: string
          p_current_step: number
          p_is_completed: boolean
          p_lesson_id: string
          p_stars_earned: number
        }
        Returns: Json
      }
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

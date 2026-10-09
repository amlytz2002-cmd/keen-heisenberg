# CENNA.live REST API Endpoint Reference

**Base Path:** `/api`  
**Protocol:** HTTPS / JSON  
**Authentication:** HTTP Bearer Token (`Authorization: Bearer <supabase_access_token>`)  

---

## 1. Authentication & Profile

### `GET /api/auth/profile`
Returns the profile and assigned multi-roles of the authenticated user.
- **Headers:** `Authorization: Bearer <token>`
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "email": "user@university.edu",
      "full_name": "Dr. Cenan Demir",
      "primary_role": "instructor",
      "roles": ["instructor", "student"]
    }
  }
  ```

### `POST /api/auth/profile`
Updates profile metadata or switches primary role.
- **Request Body:**
  ```json
  {
    "full_name": "Dr. Cenan Demir",
    "primary_role": "instructor"
  }
  ```

---

## 2. Academic Classrooms & Invitations

### `GET /api/classrooms`
Lists classrooms where the user is an enrolled member or instructor.

### `POST /api/classrooms`
Creates a new academic classroom (Instructors & Admins only).
- **Request Body:**
  ```json
  {
    "name": "Dönem 3 Biyofarmasötik & Farmakokinetik",
    "description": "Faculty of Pharmacy, Fall 2026 cohort"
  }
  ```

### `POST /api/classrooms/:id/invitations`
Generates a cryptographic enrollment token with usage and expiry limits.
- **Request Body:**
  ```json
  {
    "max_uses": 50,
    "expires_in_days": 14
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "raw_token": "inv_8f7b3c2e1d...",
      "expires_at": "2026-10-23T12:00:00.000Z",
      "max_uses": 50
    }
  }
  ```

### `POST /api/invitations/:token`
Redeems a cryptographic invitation and enrolls the caller into the classroom.

---

## 3. Curriculum & Learning Modules

### `GET /api/courses`
Lists available courses. Optional query parameter: `?classroom_id=<uuid>`.

### `POST /api/courses`
Creates a course syllabus.
- **Request Body:**
  ```json
  {
    "classroom_id": "uuid",
    "title": "Clinical Pharmacokinetics",
    "code": "PHA-304",
    "description": "Focus on clearance, half-life, and multi-compartment kinetics."
  }
  ```

### `POST /api/courses/:id`
Adds a learning module to an existing course.
- **Request Body:**
  ```json
  {
    "title": "Module 1: Creatinine Clearance & Renal Adjustment",
    "description": "Cockcroft-Gault equation and female adjustment coefficient."
  }
  ```

---

## 4. Document Ingestion & Semantic Chunking

### `POST /api/resources`
Registers an instructional document or lecture notes in the repository.
- **Request Body:**
  ```json
  {
    "course_id": "uuid",
    "title": "Biopharmaceutics Lecture 04 — Clearance.pdf",
    "file_path": "course-resources/clearence_lec04.pdf",
    "file_type": "pdf",
    "file_size_bytes": 1048576,
    "raw_text": "Optional text override..."
  }
  ```

### `POST /api/resources/:id/process`
Triggers server-side text extraction and semantic chunking with paragraph-level coordinates.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "chunks_count": 18,
      "resource_id": "uuid"
    }
  }
  ```

---

## 5. AI Generation & Content Review Workspace

### `POST /api/ai/generate`
Executes server-side LLM extraction across document chunks.
- **Request Body:**
  ```json
  {
    "resource_id": "uuid",
    "course_id": "uuid",
    "mode": "all"
  }
  ```
- **Behavior:** Generated items are assigned `status = 'needs_review'`. They are strictly invisible to students until approved.

### `GET /api/teach/content-review`
Retrieves items in the review queue.
- **Query Parameters:** `?status=needs_review&course_id=<uuid>`

### `POST /api/teach/content-review`
Applies an instructor moderation action to an item.
- **Request Body:**
  ```json
  {
    "item_type": "question",
    "item_id": "uuid",
    "action": "approve" | "publish" | "reject" | "edit_and_approve",
    "rejection_reason": "Optional rejection notes",
    "edited_payload": { "stem": "Corrected stem...", "explanation": "..." }
  }
  ```

---

## 6. Active Study Sessions & Retrieval Engine

### `GET /api/study/session`
Initiates or resumes a focused ~25-minute retrieval study session.
- **Query Parameters:** `?course_id=<uuid>&concept_id=<uuid>`
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "session": { "id": "uuid", "target_duration_minutes": 25 },
      "concept": { "id": "uuid", "name": "Cockcroft-Gault Equation", "description": "..." },
      "questions": [ ... ]
    }
  }
  ```

### `POST /api/study/hint`
Requests a graduated Socratic hint without revealing the final answer.
- **Request Body:**
  ```json
  {
    "session_id": "uuid",
    "question_id": "uuid",
    "hint_stage": 1 | 2 | 3
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "hint_stage": 1,
      "hint_text": "What fundamental relationship links creatinine clearance to serum creatinine and age?"
    }
  }
  ```

### `POST /api/study/submit-answer`
Grades an answer, records question attempt telemetry, and advances the 1-3-7-14 spaced repetition interval.
- **Request Body:**
  ```json
  {
    "session_id": "uuid",
    "question_id": "uuid",
    "user_answer": "B",
    "response_time_ms": 14200,
    "hints_used_count": 1
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "is_correct": true,
      "explanation": "Correct. In female patients, muscle mass is approximately 85% of males.",
      "mastery_score": 78,
      "next_review_days": 3
    }
  }
  ```

---

## 7. Spaced Repetition Queue

### `GET /api/reviews`
Returns the user's due spaced repetition concepts, prioritized by days overdue and lapse count.

---

## 8. Timed Mock Exams & Deadlines

### `GET /api/exams`
Lists available published mock examinations.

### `POST /api/exams`
Creates an examination template (Instructor only).
- **Request Body:**
  ```json
  {
    "classroom_id": "uuid",
    "title": "Midterm Mock Examination",
    "duration_minutes": 45,
    "passing_score_pct": 70,
    "question_ids": ["uuid-1", "uuid-2"]
  }
  ```

### `POST /api/exams/:id/start`
Starts a timed exam attempt and establishes an authoritative server deadline.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "attempt_id": "uuid",
      "deadline_at": "2026-10-09T11:45:00.000Z",
      "exam": { "title": "...", "duration_minutes": 45, "questions": [...] }
    }
  }
  ```

### `POST /api/exams/attempts/:attemptId/answers`
Autosaves intermediate responses. Checks server deadline and rejects if expired.
- **Request Body:**
  ```json
  {
    "answers": [
      { "question_id": "uuid-1", "answer_payload": "B" },
      { "question_id": "uuid-2", "answer_payload": [ "A", "C" ] }
    ]
  }
  ```

### `POST /api/exams/attempts/:attemptId/submit`
Finalizes and grades the exam. Generates topic-by-topic diagnostic breakdown with remediation tagging.

---

## 9. Learning Analytics & Diagnostics

### `GET /api/analytics`
- **Student Context:** Returns personal concept mastery distribution, retention stability, and historical attempt scores.
- **Instructor Context (`?classroom_id=<uuid>`):** Returns classroom-wide error rates, high-risk concepts, and common clinical misconceptions.

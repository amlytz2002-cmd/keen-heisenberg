# CENNA.live Application Security & Threat Model Specification

**Version:** 1.0 (Pilot Implementation)  
**Security Posture:** Production-Minded Zero-Trust Architecture  
**Target:** OWASP Top 10 + Academic Platform Integrity Standards  

---

## 1. Core Security Tenets

1. **Defense in Depth:** Access control is enforced at both the API boundary (Cloudflare Pages Functions) and the persistent database engine layer (PostgreSQL 17 RLS). Hiding a UI button or omitting a route is never considered security.
2. **Server-Side Secret Custody:** No privileged API keys (Supabase service-role key, OpenRouter API keys, Resend credentials) are ever packaged into Vite client bundles. The browser client receives only the public anonymous key.
3. **Intellectual & Student Isolation:** Row Level Security guarantees that learners can only observe their own learning sessions, scores, and hint histories. Instructors cannot access student data outside their authorized classroom boundaries.
4. **Authoritative Server Timekeeping:** Timed exams cannot be manipulated by client clock changes, browser restarts, or network throttling.

---

## 2. Threat Modeling & Mitigation Matrix

### 2.1 Unauthorized Data Access (Broken Object Level Authorization - BOLA)
- **Threat:** A student changes an `id` in an API call (e.g. `GET /api/study/session?concept_id=...` or `exam_attempts/:id`) to inspect another learner's answers or exams.
- **Mitigation:**
  - Supabase RLS enforces `auth.uid() = user_id` on all attempt, session, and progress tables.
  - Cloudflare Pages Functions verify that the caller is an enrolled classroom member before returning course resources or exams.

### 2.2 Unverified AI Hallucination Exposure
- **Threat:** AI-extracted questions contain fabricated equations, inaccurate clinical dosing, or incorrect explanations that mislead students.
- **Mitigation:**
  - AI extraction runs deposit all extracted questions and concepts with `status = 'needs_review'`.
  - Student query policies explicitly enforce `status = 'published'`.
  - The **Content Review Workspace** forces instructors to inspect the exact source chunk coordinates side-by-side with generated items before approving or publishing.

### 2.3 Invitation Token Brute-Forcing & Replay Attacks
- **Threat:** Malicious actors attempt to guess invitation tokens or reuse expired links to gain unauthorized classroom entry.
- **Mitigation:**
  - Raw invitation tokens are generated with 256-bit cryptographically secure randomness.
  - Only the SHA-256 hash (`token_hash = sha256(raw_token)`) is persisted in the database; raw tokens are never stored.
  - The redemption endpoint enforces `times_used < max_uses` and `expires_at > NOW()` within an atomic transaction.

### 2.4 Exam Deadline Tampering & Late Answer Injection
- **Threat:** A student pauses JavaScript execution, freezes local time, or submits answers minutes after an examination period ends.
- **Mitigation:**
  - Start time (`started_at`) and absolute deadline (`deadline_at = started_at + duration_minutes`) are computed authoritatively on the server.
  - Every intermediate answer save and final submission validates:
    ```typescript
    if (Date.now() > new Date(attempt.deadline_at).getTime() + 30_000) {
      return jsonError('Exam deadline has passed. Late submissions are rejected.', 403);
    }
    ```

### 2.5 Prompt Injection & Model Jailbreaking
- **Threat:** Malicious or malformed text in uploaded documents attempts to instruct the LLM to output arbitrary content or ignore formatting schemas.
- **Mitigation:**
  - Ingested text chunks are sanitized to strip system prompt delimiters and Markdown code block escapes.
  - The model cascade uses strict Zod schema validation (`ZodType.parse()`). If a model outputs answers that do not conform to schema or attempts to reveal answers prematurely, the response is discarded and the cascade advances to the next model.
  - Deterministic preceptor fallbacks guarantee consistent operation if upstream LLM APIs fail.

---

## 3. Row Level Security Audit Trail

All tables feature active RLS. Key security policies include:

| Policy Name | Target Table | Action | Policy Condition |
|---|---|---|---|
| `user_concept_progress_self` | `user_concept_progress` | ALL | `auth.uid() = user_id` |
| `classroom_members_view` | `classroom_members` | SELECT | `auth.uid() = user_id OR is_instructor(auth.uid(), classroom_id)` |
| `questions_student_published` | `questions` | SELECT | `status = 'published'` |
| `questions_instructor_manage` | `questions` | ALL | `is_instructor(auth.uid())` |
| `exam_attempts_owner` | `exam_attempts` | ALL | `auth.uid() = user_id` |
| `audit_logs_admin_read` | `audit_logs` | SELECT | `is_admin(auth.uid())` |

---

## 4. Academic Integrity & Clinical Disclaimer

CENNA.live is built to cultivate rigorous conceptual comprehension in pharmacy and health sciences students.
- **Explicit Boundary:** CENNA.live is an academic retrieval engine. It does NOT provide automated clinical patient diagnosis, active prescription verification, or real-time clinical decision support.
- Users are notified of this boundary in the platform Terms of Service and application layout.

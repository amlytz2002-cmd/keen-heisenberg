# CENNA.live — AI-Powered Active Learning & Retrieval Platform

**Version:** 1.0 (Pilot Implementation)  
**Stack:** React 18, Vite, TypeScript, Cloudflare Pages Functions, Supabase (PostgreSQL 17), Resend  
**Pedagogical Engine:** Learn → Retrieve → Apply → Remediate → Review  

---

## 1. Overview & Vision

**CENNA.live** is an educational active recall and retrieval practice platform built for demanding academic fields, starting with clinical pharmacokinetics, biopharmaceutics, and therapeutics.

Instead of acting as a generic conversational chatbot or passive document repository, CENNA.live converts authoritative instructional materials into structured, bite-sized **~25-minute study sessions**, active retrieval questions, **3-stage Socratic hint ladders**, and scientifically scheduled **1, 3, 7, and 14-day spaced repetition queues**.

### Core Pedagogical Principles

1. **Evidence Before Confidence:** Every concept card, question stem, and explanation links directly to uploaded course documents with page and paragraph provenance.
2. **Retrieval Before Recognition:** Closed-book active recall challenges force memory reconstruction before answer revelation.
3. **Guidance Before Revelation:** Socratic hint progression (Stage 1 Orientation → Stage 2 Reasoning → Stage 3 Application) scaffolds learning without premature answer disclosure.
4. **Mastery Over Vanity Metrics:** Tracks demonstrated retention and hint independence (0–100 mastery scale) instead of meaningless streaks.
5. **Mandatory Instructor Review Gate:** AI-generated educational items are deposited into a mandatory `needs_review` state. Unreviewed materials are strictly isolated and never visible to students.

---

## 2. Architecture & Tech Stack

```
                   ┌──────────────────────────────────────────────┐
                   │               CENNA.live SPA                 │
                   │      (Vite + React 18 + TypeScript + AntD)   │
                   └──────────────────────┬───────────────────────┘
                                          │
                        HTTPS / JSON + Bearer JWT
                                          │
                   ┌──────────────────────▼───────────────────────┐
                   │    Cloudflare Pages Functions (/api/*)       │
                   │  - Auth & Profile Inspection                 │
                   │  - Classroom & Cryptographic Invitations     │
                   │  - Course & Document Semantic Chunking       │
                   │  - AI Concept & Question Extraction          │
                   │  - Instructor Review & Publication Gate      │
                   │  - Active Study Sessions & Grading           │
                   │  - 1-3-7-14 Spaced Repetition Engine         │
                   │  - Timed Mock Exams & Server Deadlines       │
                   │  - Transactional Emails (Resend)             │
                   └──────────────────────┬───────────────────────┘
                                          │
                       PostgreSQL 17 + Row Level Security
                                          │
                   ┌──────────────────────▼───────────────────────┐
                   │           Supabase Data Layer                │
                   │  - 27 Relational Tables                      │
                   │  - Fine-Grained RLS Policies                 │
                   │  - Private Buckets (course-resources)        │
                   │  - Immutable Security Audit Trail            │
                   └──────────────────────────────────────────────┘
```

---

## 3. Key Feature Modules

### For Students
- **Today Hub (`/app/today`):** Daily focused study plan targeting ~25 minutes, real-time counter of due spaced reviews, active course cards, and overall mastery gauge.
- **Academic Classrooms (`/app/classrooms`):** Browse enrolled classes, view syllabi, and redeem cryptographic enrollment codes.
- **Active Study Sessions (`/app/study/:sessionId`):** Closed-book retrieval items (single-choice, multi-select, calculations with ±5% scientific tolerance, short-answer), 3-stage Socratic hint progression modal, and grounded feedback citations.
- **Spaced Repetition Queue (`/app/review`):** 1, 3, 7, and 14-day intervals with automatic lapse reset on error.
- **Timed Mock Exams (`/app/exams`):** Server-enforced start time and deadline calculation (`deadline_at = NOW() + duration`), periodic answer autosave, question palette navigation, and post-exam topic remediation.
- **Progress Analytics (`/app/progress`):** Transparent concept mastery distributions, retention stability metrics, and first-attempt accuracy without vanity fluff.

### For Instructors
- **Teaching Hub (`/app/teach`):** Classroom oversight, total enrolled learners, pending review queue counter, and quick authoring shortcuts.
- **Classroom Manager (`/app/teach/classrooms`):** Create academic classrooms and generate single-use or multi-use cryptographic invitation tokens with customizable expiration.
- **Course & Module Builder (`/app/teach/courses`):** Author curriculum courses, organize modules, and link learning objectives.
- **Document Ingestion & Chunking (`/app/teach/resources`):** Upload textbooks and lecture slides (PDF, DOCX, TXT), triggering server-side text extraction and semantic chunking with paragraph-level coordinates.
- **Content Review Workspace (`/app/teach/content-review`):** Side-by-side inspection of source document excerpts against AI-drafted questions. Approve, edit and approve, publish, or reject with feedback.
- **Classroom Diagnostics (`/app/teach/analytics`):** Real-time aggregate error rates, common clinical misconceptions, and identified at-risk concepts to focus lecture reviews.

### For Administrators
- **Security Audit Trail (`/app/admin/audit`):** Immutable log of administrative actions, AI extraction jobs, and role transitions.

---

## 4. Local Development & Testing

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd build_cennalive_pilot

# 2. Install dependencies
npm install

# 3. Run typecheck
npm run typecheck

# 4. Run automated test suite (290 tests)
npm test

# 5. Build for production
npm run build

# 6. Start local Vite development server
npm run dev
```

### Pre-Seeded Demo Accounts for Fast Pilot Evaluation
In the sign-in modal, one-click demo buttons are provided:
- **Demo Student:** `pilot.student@biruni.edu.tr` (Biruni University Faculty of Pharmacy, Year 3 Cohort)
- **Demo Instructor:** `instructor.demo@cenna.live` (Dr. Cenan Demir, Lead Instructor)

---

## 5. Security & Privacy Guarantees

1. **Server-Side Secret Protection:** OpenRouter/OpenAI API keys, Supabase service-role keys, and Resend credentials reside strictly in Cloudflare Pages edge functions.
2. **PostgreSQL Row Level Security (RLS):** All 27 tables enforce granular access policies. Students cannot view other students' attempts or unapproved drafts; instructors can only access classrooms they teach.
3. **Private Document Storage:** The `course-resources` storage bucket is private; files are retrieved only via signed URLs or backend processing workers.
4. **Clinical Decision Disclaimer:** CENNA.live is designed for academic educational retrieval. It is explicitly not a clinical diagnostic system or direct patient treatment tool.

---

## 6. Documentation Directory

- [`docs/ARCHITECTURE.md`](file:///C:/Users/hp/.gemini/antigravity/worktrees/keen-heisenberg/build_cennalive_pilot/docs/ARCHITECTURE.md) — Comprehensive technical architecture & system components
- [`docs/DATABASE.md`](file:///C:/Users/hp/.gemini/antigravity/worktrees/keen-heisenberg/build_cennalive_pilot/docs/DATABASE.md) — Database schema, relationships, and RLS policies
- [`docs/SECURITY.md`](file:///C:/Users/hp/.gemini/antigravity/worktrees/keen-heisenberg/build_cennalive_pilot/docs/SECURITY.md) — Application security, authorization, and threat model
- [`docs/DEPLOYMENT.md`](file:///C:/Users/hp/.gemini/antigravity/worktrees/keen-heisenberg/build_cennalive_pilot/docs/DEPLOYMENT.md) — Cloudflare Pages & Supabase deployment guide
- [`docs/API.md`](file:///C:/Users/hp/.gemini/antigravity/worktrees/keen-heisenberg/build_cennalive_pilot/docs/API.md) — Full REST API endpoint reference
- [`docs/TESTING.md`](file:///C:/Users/hp/.gemini/antigravity/worktrees/keen-heisenberg/build_cennalive_pilot/docs/TESTING.md) — Testing strategy, test suites, and empirical evidence
- [`docs/AI_CONTENT_POLICY.md`](file:///C:/Users/hp/.gemini/antigravity/worktrees/keen-heisenberg/build_cennalive_pilot/docs/AI_CONTENT_POLICY.md) — AI safety, grounding, and content review gates

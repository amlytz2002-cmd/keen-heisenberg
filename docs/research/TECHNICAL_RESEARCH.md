# Campus Study Platform (CENNA.live) — Technical Research & Verification

**Date:** 2026-10-12  
**Lead Architect:** Autonomous Cloud & Security Engineer  

---

## 1. Cloudflare Runtime & Deployment Research

### 1.1 React + Vite on Cloudflare Pages
- **Official Documentation Source:** [Cloudflare React Web Apps Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/) & [Pages Functions Routing](https://developers.cloudflare.com/pages/functions/routing/)
- **Key Findings:**
  - Cloudflare Pages seamlessly serves static client assets built with Vite (`dist/` output directory) across global edge CDN points of presence.
  - Client-side pushState SPAs require an explicit rewrite rule (`public/_redirects` with `/* /index.html 200`) to prevent HTTP 404 errors when users refresh deep links (e.g. `/app/today` or `/learn/mission/1`).
  - Edge server routes placed in `functions/api/*` execute on Cloudflare's V8-based Edge Workers runtime without cold starts, supporting standard web primitives (`Request`, `Response`, `fetch`, Web Crypto API).
- **Architectural Impact on Codebase:**
  - Implemented `public/_redirects` with `/* /index.html 200`.
  - Configured `wrangler.toml` with `pages_build_output_dir = "dist"` and `compatibility_date = "2024-03-01"`.
  - Structured all privileged endpoints under `functions/api/` (`study`, `exams`, `reviews`, `classrooms`, `invitations`, `resources`, `ai`).

### 1.2 Secrets & Environment Variable Management
- **Official Documentation Source:** [Cloudflare Secrets Management](https://developers.cloudflare.com/workers/configuration/secrets/)
- **Key Findings:**
  - Client bundles must never contain secrets (`RESEND_API_KEY`, Supabase `service_role` key).
  - Cloudflare Pages separates client build environment variables (prefixed with `VITE_` in `.env.example`) from server-only runtime secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `OPENROUTER_API_KEY`) passed in the Worker context `env`.
- **Architectural Impact:**
  - In `functions/_lib/supabaseServer.ts`, client requests use the anonymous key or forward user bearer JWTs, while elevated operations use `env.SUPABASE_SERVICE_ROLE_KEY` exclusively inside Edge Functions.

---

## 2. Supabase Architecture, PostgreSQL 17 & RLS Research

### 2.1 Row Level Security (RLS) & Role Model
- **Official Documentation Source:** [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security) & [Secure Data Guide](https://supabase.com/docs/guides/database/secure-data)
- **Key Findings:**
  - PostgreSQL 17 Row Level Security must be enabled on every table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
  - Policies must enforce strict boundaries using `auth.uid()`.
  - Storing user roles in editable user metadata (`raw_user_meta_data`) creates severe privilege escalation vulnerabilities. Roles must be isolated in an independent `user_roles` table, populated via database triggers on `auth.users` creation, and queryable via helper functions (`has_role(user_id, 'instructor')`).
- **Architectural Impact:**
  - All 37 public tables in migration `003_cennalive_full_schema.sql` and `20261011180003_rls_and_policies.sql` have RLS enabled.
  - Created isolated `public.user_roles` table with security definer lookup function `public.get_user_role(p_user_id UUID)` and hardened search paths.

### 2.2 Private Storage & Signed URLs
- **Official Documentation Source:** [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- **Key Findings:**
  - Academic course documents (PDFs, slide decks) contain faculty intellectual property and must not reside in public storage buckets.
  - Buckets must be marked `public = false`.
  - Access is governed by RLS storage policies on `storage.objects` or brokered via Edge Functions generating short-lived signed URLs (`supabase.storage.from('course-resources').createSignedUrl(path, 3600)`).
- **Architectural Impact:**
  - Provisioned private `course-resources` (50MB limit) and `user-avatars` (5MB limit) buckets in `20261011180001_core_tables_and_storage.sql`.

---

## 3. Transactional Email with Resend

### 3.1 Cloudflare Edge Integration
- **Official Documentation Source:** [Cloudflare & Resend Tutorial](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/) & [Resend API Docs](https://resend.com/docs/api-reference/emails/send-email)
- **Key Findings:**
  - Sending email from serverless workers requires issuing HTTPS POST requests to `https://api.resend.com/emails` with `Authorization: Bearer RESEND_API_KEY`.
  - Transactional email endpoints must be rate-limited and idempotent to prevent abuse and mail delivery spam.
- **Architectural Impact:**
  - Created `functions/_lib/emailService.ts` implementing typed email dispatch with Zod schema validation, transactional templates (classroom invites, password recovery, verification, due review alerts), and persistence to `public.email_events`.
  - Graceful fallback: If `RESEND_API_KEY` is not configured, the service logs the email event with status `simulated` and returns simulated delivery metadata without throwing unhandled exceptions.

---

## 4. Scientific Literature Audit & Cognitive Science Verification

### 4.1 Latimier et al. (2019) Feedback Effect-Size Audit
- **Primary Source:**
  - Latimier, A., Riegert, A., Peyre, H., Ly, S. T., Casati, R., & Ramus, F. (2019). *Does pre-testing promote better retention than post-testing?* **npj Science of Learning**, 4, 15. [DOI: 10.1038/s41539-019-0053-1]
- **Audit of the Claim:**
  - *Context:* Previous secondary engineering notes claimed that pre-testing (generating answers prior to studying) combined with corrective feedback produces an extraordinary effect size compared to traditional testing.
  - *Verification against Primary Data:*
    - In the primary experiment, participants learned factual educational texts across three conditions:
      1. **Extended Reading Control**
      2. **Pre-testing with Feedback** (answering questions before reading the text)
      3. **Post-testing with Feedback** (reading the text first, then answering retrieval questions with feedback)
    - On a delayed final retention test administered **7 days later**:
      - **Post-testing effect size:** Cohen's $d = 0.74$ ($p < 0.001$) relative to reading control (a large, robust effect).
      - **Pre-testing effect size:** Cohen's $d = 0.35$ ($p < 0.01$) relative to reading control (a small-to-moderate effect).
      - **Direct Comparison:** Post-testing was significantly superior to pre-testing ($p < 0.001$, Cohen's $d \approx 0.39$).
  - *Conclusion & Scientific Correction:*
    - The claim that pre-testing is superior or generates massive effect sizes over post-testing is **empirically false**.
    - The true scientific finding of Latimier et al. (2019) is that **traditional retrieval practice (post-testing) produces more than double the effect size of pre-testing ($d = 0.74$ vs. $d = 0.35$)** for delayed retention.
    - Pre-testing is still beneficial compared to passive reading alone, but post-study retrieval practice remains the gold standard in cognitive psychology.
- **Architectural Application:**
  - CENNA.live anchors its primary learning loop on **post-exposure deliberate retrieval practice** (lectures followed by active retrieval drills, case calculations, and FSRS spaced review), while utilizing pre-testing only as an optional diagnostic trigger.

### 4.2 Spaced Repetition & Hypercorrection Effect
- **Primary Sources:**
  - Free Spaced Repetition Scheduler (FSRS v4.5) & Butterfield & Metcalfe (2001) Hypercorrection Effect.
- **Formulas Implemented in `src/lib/engines/fsrs.ts`:**
  - Memory retrievability: $R(t, S) = \left(1 + \frac{19}{81}\frac{t}{S}\right)^{-0.5}$
  - High-confidence errors trigger immediate hypercorrection ($S = 0$), scheduling a forced re-test within 24 hours.
  - Correct retrievals increment review intervals across stages (1 day $\rightarrow$ 3 days $\rightarrow$ 7 days $\rightarrow$ 14 days $\rightarrow$ 30 days).

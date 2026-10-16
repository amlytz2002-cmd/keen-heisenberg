# Project State & Execution Ledger (`plan.md`)

## Active Project / Feature
*Status: DEPLOYED & VERIFIED IN PRODUCTION (CENNA.live v2.0 — Full UI/UX Overhaul with Tailwind CSS, `shadcn/ui` & `Magic UI` + Auth/Email Pipeline)*

- **Objective:** Replace the fragmented Ant Design / inline-style frontend with a cohesive, dark-mode-first **Tailwind CSS + `shadcn/ui` + `Magic UI`** architecture; build a high-impact interactive Hero Cover & Landing flow; enforce client-side route guards; fix the confirmation email & onboarding pipeline; and eliminate all layout overlaps and mobile responsiveness bugs across the Clinical Rescue Lab and dashboards.
- **Target Stack:**
  - **UI Foundation (80% Core App):** Tailwind CSS + `shadcn/ui` (Radix UI primitives, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`) for accessible dark-mode dialogs, sheets/drawers, tabs, forms, badges, tables, and `<Skeleton />` loaders.
  - **Marketing, Hero & Telemetry HUD (20% Landing & Gamification):** `Magic UI` + `framer-motion` (`BorderBeam`, `AnimatedBeam`, `BentoGrid`, `NumberTicker`, `Spotlight` hero background) for the pre-login cover experience and live pharmacokinetic telemetry accents.
  - **Backend & Auth:** Supabase Auth (`ltmtmhmadsrlvuqffdcs`) + Cloudflare Pages Functions (`functions/api/*`) + Resend transactional email service (`functions/_lib/emailService.ts`).

---

## 1. Feature Specifications & UI/UX Overhaul Scope

### 1.1. Design System & Global Shell (`Tailwind CSS` + `shadcn/ui` + `Magic UI`)
- **Dark-Mode First Palette:**
  - Primary Canvas: `#060B14` (`slate-950`)
  - Elevated Surface / Glass Cards: `#0F172A/80` (`slate-900/80` with `backdrop-blur-md` and crisp `border-slate-800`)
  - Accents: Electric Cyan (`#0EA5E9`), Clinical Emerald (`#10B981`), Amber Warning (`#F59E0B`), Critical Rose (`#F43F5E`)
  - Typography: `Inter` / system sans for UI & Turkish academic text; `JetBrains Mono` for pharmacokinetic equations, pKa/LogP readouts, and vitals telemetry.
- **Responsive Navigation (`src/components/Navbar.tsx` & `src/components/Footer.tsx`):**
  - Unified dark glassmorphic top navbar across Public, Student, Instructor, and Admin views.
  - Mobile drawer (`shadcn/ui` `<Sheet>`) for `<768px` viewports so navigation links (`Klinik Laboratuvar`, `Bugün`, `Tekrar`, `Sınavlar`, `İlerleme`) never vanish on mobile.
  - Clicking the `CENNA.live` logo always navigates to `/` (`LandingView`), and when logged in, displays a prominent **"Panele Dön (Dashboard)"** CTA instead of forcefully hijacking `/` away from the landing page.

### 1.2. Public Cover, Hero Section & Pre-Auth Bridge (`src/views/Public/*`)
- **`LandingView.tsx` (Interactive Dark-Mode Cover Page):**
  - **Hero Section:** Spotlight dark-mode backdrop with `Magic UI` `BorderBeam` showcasing a live, interactive **Mini Molecular Rescue & Socratic Telemetry Preview** right on the cover page.
  - **Unified Value Proposition:** Connects all 3 pillars of CENNA.live into one coherent story:
    1. *Yapay Zekâ Destekli Ders Notu & Kavram Çıkarımı* (Instructor PDF $\rightarrow$ Concept Graph via `AnimatedBeam`),
    2. *Klinik Kurtarma Laboratuvarı & Moleküler Tasarım* (21 Interactive Medicinal Chemistry & PK/PD Rescue Missions),
    3. *Sokrates Tipi Öncül İpucu & FSRS Aralıklı Tekrar* (Long-term clinical retention).
  - **Bento Feature Grid (`Magic UI` `BentoGrid`):** High-contrast cards with live micro-interactions and `NumberTicker` metrics.
  - **Role-Aware Onboarding Bridge:** Clear segmented entry paths for **Öğrenci (Student)**, **Eğitmen (Instructor)**, and **1-Tıkla Canlı Demo (Instant Sandbox)** leading smoothly into `/auth/register` or `/auth/login`.
- **`FeaturesView.tsx`, `HowItWorksView.tsx`, `LegalView.tsx`:**
  - Rebuilt in dark-mode with interactive step-by-step pipeline diagrams and zero generic boilerplate cards.

### 1.3. Authentication Flow, Route Guards & Confirmation Email Pipeline
- **Client-Side Route & Role Guards (`src/App.tsx`):**
  - Implement `<ProtectedRoute>` and `<RoleGuard allowedRoles={[...]}>`:
    - Unauthenticated visitors hitting `/app/*` or `/learn/*` are cleanly redirected to `/auth/login?redirect=...` with a clear toast/banner.
    - Authenticated users hitting `/auth/login` or `/auth/register` are automatically redirected to their role home (`/app/teach` for instructors, `/app/today` for students).
- **Fixed Login & Registration State Machine (`src/views/Public/AuthView.tsx` & `src/context/AuthContext.tsx`):**
  - Fix stale closure in `refreshProfile()`: return `{ profile, roles, activeRole }` directly from `refreshProfile()` so `handleLogin` routes instructors to `/app/teach` and students to `/app/today` deterministically.
  - Separate loading states per action (`isSubmittingLogin`, `isSubmittingRegister`, `isDemoStudentLoading`, `isDemoInstructorLoading`) so clicking one button never spins both demo buttons.
  - **Email Verification UX:**
    - When a real user registers (`handleRegister`), if email confirmation is required (`!data.session`), transition `AuthView` to a dedicated **"E-posta Doğrulama Gönderildi" (Verify Your Email)** card showing the target email address, spam-folder tips, a **"Doğrulama E-postasını Tekrar Gönder" (Resend Verification)** button (with 60s cooldown), and a `/auth/callback` handler.
    - If `data.session` is returned (e.g., auto-confirmed demo or verified session), immediately navigate to the user's dashboard instead of dumping them back onto the Login tab.

### 1.4. Clinical Rescue Lab & Interactive Simulators (`src/views/Student/MissionPlayer.tsx` & `src/components/interactive/*`)
- **Eliminate Flexbox Clipping & Overlaps (`MissionPlayer.tsx`):**
  - Remove `height: 100vh; overflow: hidden` on mobile/tablet and remove the collapsing `minHeight: 280; justifyContent: center` wrapper around `<WidgetRenderer />`. Give all step cards and widget containers `flex-shrink-0` and clean vertical spacing (`space-y-6`).
- **Eliminate Duplicate UI Chrome:**
  - Remove the duplicate patient header in `MissionPlayer.tsx` (keep the canonical HUD inside `PatientVitalsMonitor.tsx`).
  - Consolidate the duplicate pharmacokinetic telemetry readouts and duplicate **"Molekülü Sentezle ve Uygula"** buttons between `MolecularToolbox.tsx` and `MissionPlayer.tsx` into a single, authoritative bottom action bar with `Magic UI` `BorderBeam` feedback.
- **High-Contrast Dark-Mode Badges & Socratic Drawer:**
  - Replace Ant Design `<Tag color="blue/purple/orange/cyan">` (which rendered light-mode pastel backgrounds on dark cards) with custom dark-mode `shadcn/ui` `<Badge>` variants (`bg-sky-500/15 text-sky-300 border-sky-500/30`, etc.).
  - Replace the Ant Design `<Drawer>` in `MissionPlayer.tsx` with a dark-mode `shadcn/ui` `<Sheet>` featuring a high-contrast close button (`text-slate-300 hover:text-white`) and untruncated action buttons.
- **Mobile Responsiveness (`390px`–`768px`):**
  - Convert the rigid `gridTemplateColumns: '420px 1fr'` in `MissionPlayer.tsx` and `250px 1fr` in `EnzymeCleavageSimulator.tsx` / `ReceptorPocketFit.tsx` into responsive Tailwind grids (`grid-cols-1 lg:grid-cols-[380px_1fr]`), with a sticky mobile Patient Vitals summary bar that expands on tap.

### 1.5. Student, Instructor & Admin Dashboards (`src/views/Student/*`, `src/views/Instructor/*`, `src/views/Admin/*`)
- **Unified Curriculum Entry (`SkillTreeView.tsx` & `TodayView.tsx`):**
  - Harmonize `/learn` (`SkillTreeView`) and `/app/today` (`TodayView`) into the dark-mode clinical design system, clearly linking foundational micro-lessons (`/learn/lesson/:id`) and 21 Clinical Rescue Missions (`/learn/mission/:id`).
- **Defensive States on Every View:**
  - Replace fake "Tebrikler! Oturumu Tamamladınız" / "Kuyruk Tertemiz" fallbacks on API errors with explicit error banners + retry buttons when an endpoint returns `401`/`500`, and show `shadcn/ui` `<Skeleton />` placeholders while loading.

---

## 2. Database Schema & RLS Requirements (`db-architect`)

1. **Migration `supabase/migrations/20261016160000_auth_confirmation_and_email_events.sql`:**
   - Update `public.handle_new_user_autoconfirm()` (`BEFORE INSERT ON auth.users`):
     - Auto-confirm **only** `@cenna.live` demo/seed accounts (`IF NEW.email LIKE '%@cenna.live' THEN NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW()); END IF;`).
     - For all real user emails, leave `NEW.email_confirmed_at` untouched (`NULL` on signup) so Supabase GoTrue dispatches the confirmation email via Resend SMTP (`bildirim@cenna.live`).
   - Verify RLS policies on `public.email_events`, `public.profiles`, `public.user_roles`, `public.user_lesson_progress`, and `public.user_gamification` remain 100% locked down to `auth.uid()`.
2. **Type Generation:**
   - Ensure `src/types/supabase.ts` and `src/types/database.types.ts` remain strictly synchronized with the remote schema (`ltmtmhmadsrlvuqffdcs`).

---

## 3. Resend Transactional Email Hooks (`fullstack-builder` & `cf-ops`)

1. **Welcome & Verification Email Builder (`functions/_lib/emailService.ts`):**
   - Add `buildWelcomeOnboardingEmail({ recipientName, recipientEmail, role, dashboardUrl })` with dark-mode-inspired academic Turkish HTML styling.
2. **Edge Endpoint (`functions/api/auth/welcome-email.ts`):**
   - `POST /api/auth/welcome-email`:
     - Validates payload with strict `zod` schema (`email`, `fullName`, `role`).
     - Enforces sliding-window rate limiting via `checkRateLimit` (`maxRequests: 3, windowMs: 60_000`).
     - Dispatches welcome/onboarding email via Resend (`sendTransactionalEmail`) and logs idempotency state in `public.email_events`.
3. **Resend Verification Helper in `AuthView.tsx`:**
   - Wire `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/auth/login` } })` with clear rate-limit and delivery feedback.

---

## 4. 5-Phase Execution Pipeline (Pending User Confirmation)

- [x] **Phase 1 (`db-architect`):** Authored & verified `supabase/migrations/20261016160000_auth_confirmation_and_email_events.sql`.
  - Replaced `public.handle_new_user_autoconfirm()` to selectively auto-confirm only `@cenna.live` demo accounts; real user emails remain unconfirmed (`NULL`) so Supabase GoTrue dispatches confirmation emails via Resend (`bildirim@cenna.live`).
  - Re-ensured `on_auth_user_created_autoconfirm` trigger on `auth.users` with execution granted strictly to `supabase_auth_admin` and `service_role`.
  - Expanded `public.email_events` check constraint to include `welcome_onboarding` and `account_notice`.
  - Confirmed RLS policy lockdown on `public.email_events` (`service_role` for Edge insert/select/update, authenticated users read own events or admin).
  - Regenerated and synchronized `src/types/supabase.ts` and `types/supabase.ts` from remote schema (`ltmtmhmadsrlvuqffdcs`). Verified clean compilation (`tsc --noEmit` passed with 0 errors).
- [x] **Phase 2 (`fullstack-builder`):**
  - Configured Tailwind CSS, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`, `shadcn/ui` primitives (`src/components/ui/*`), and `Magic UI` components (`src/components/magicui/*`).
  - Optimized TypeScript type checking via scoped `src/types/lucide-react.d.ts` declaration, reducing `tsc --noEmit` execution time from heap exhaustion to ~2 seconds.
  - Overhauled `LandingView`, `FeaturesView`, `HowItWorksView`, `LegalView`, `Navbar`, and `Footer` with dark-mode Hero Cover, Bento Grid, and polished borders.
  - Overhauled `App.tsx` (route guards), `AuthContext.tsx`, `AuthView.tsx`, and `functions/api/auth/welcome-email.ts` with Cloudflare Edge compatibility.
  - Overhauled interactive clinical & chemical widgets:
    - `EnzymeCleavageSimulator.tsx`: Responsive `grid-cols-1 xl:grid-cols-[250px_minmax(0,1fr)]` layout and distinct non-overlapping coordinate badges (`translate(380, 22)` for Substrate and `translate(560, 22)` for Cmax).
    - `ReceptorPocketFit.tsx`: Responsive `grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]` layout and distinct non-overlapping SVG labels.
    - `MolecularToolbox.tsx` & `PatientVitalsMonitor`: High-contrast dark styling and defensive interaction states.
  - Overhauled all Student, Instructor, and Admin views with 100% dark mode (`#060B14`, `#0F172A`, `#1E293B`) and defensive loading/empty/error states:
    - `SkillTreeView.tsx`: Dark-mode palette, direct bridge buttons to `/app/today` and `/learn/mission/mission-1`, accessible loading skeletons.
    - `InteractiveLessonPlayer.tsx` & `MissionPlayer.tsx`: Strict step isolation, preserved mistake tracking, exact localization text, zero UI leakage on route changes.
    - `AdminAuditView.tsx`, `TeachDashboardView.tsx`, `CourseManagerView.tsx`, `ResourceManagerView.tsx`, `ContentReviewWorkspace.tsx`, `ExamsListView.tsx`, `ProgressView.tsx`, `ClassroomsView.tsx`: Converted all white cards and dark text to deep navy/slate dark theme with zero `any` types.
  - Verified `tsc --noEmit` passes with 0 errors and `npm run build` (`vite build`) completes with 0 errors.
- [x] **Phase 3 (`qa-auditor`):** Emitted `STATUS: PASSED`.
  - Ran `tsc --noEmit` with 0 type errors across all application and edge function files.
  - Verified `vitest run` passes all test suites.
  - Verified zero forbidden Node.js built-ins in Edge runtime pathways.
  - Verified RLS policies across all public tables.
- [x] **Phase 4 (`cf-ops`):** Cloudflare deployment & production release completed.
  - Updated `wrangler.toml` to compatibility date `2024-09-23` with explicit `nodejs_compat` flag.
  - Synchronized Supabase remote migrations `20261016160000_auth_confirmation_and_email_events.sql` and `20261016170000_fix_classroom_members_rls_recursion.sql` on project `ltmtmhmadsrlvuqffdcs`.
  - Resolved `classroom_members` RLS recursion by hardening helper functions (`is_classroom_member`, `is_classroom_owner`, `is_classroom_instructor`) with `SECURITY DEFINER STABLE`.
  - Compiled production bundle via `npm run build` and verified Pages functions compilation with `npx wrangler pages functions build`.
  - Deployed cleanly to Cloudflare Pages (`pharmiq-app`, branch `pharmiq_pedagogical_engine_spec` -> `https://cenna.live` / `https://20c8b7b1.pharmiq-app.pages.dev`).
  - Verified production health endpoints: `https://cenna.live` (HTTP 200 OK), `https://cenna.live/api/health` (HTTP 200 OK, database connected), and `OPTIONS /api/auth/welcome-email` (HTTP 204 No Content).
- [x] **Phase 5:** Final visual & E2E verification report completed (4/4 Playwright E2E tests passed, 533 Vitest unit/integration tests passed, 0 TypeScript errors, live on `https://cenna.live` and pushed to GitHub `origin/main`).

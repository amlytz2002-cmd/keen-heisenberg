# Phase 2 Plan: Systemic Polish, Backend Resilience & 100% Turkish Academic Localization

## Objective
Execute an uncompromising, comprehensive overhaul of the entire CENNA.live platform to eliminate all English, mixed language, and machine-translated copywriting in favor of natural, high-register academic Turkish appropriate for pharmacy and medical students. Simultaneously harden all backend Cloudflare Pages functions, eliminate all legacy brand references ("PharmIQ" -> "CENNA.live"), standardize error handling, and ensure zero regression across all 290 automated tests.

---

## Execution Matrix & Quality Gates

- **Gate 1 (Brand & Backend Hardening):** Zero occurrences of "PharmIQ" or "CENNA.ai" in code/edge functions; Cloudflare edge functions return localized Turkish user feedback; `aiService.ts` prompts and deterministic fallbacks produce natural academic Turkish; `hint.ts` and `submit-answer.ts` localized.
- **Gate 2 (Public Shell & Auth Localization):** `index.html`, `Navbar.tsx`, `Footer.tsx`, `ErrorBoundary.tsx`, `LandingView.tsx`, `AuthView.tsx`, `FeaturesView.tsx`, `HowItWorksView.tsx`, `LegalView.tsx`, and `InviteRedeemView.tsx` are 100% fluent academic Turkish with zero untranslated English strings.
- **Gate 3 (Student Experience Localization):** `TodayView.tsx`, `StudySessionView.tsx` (including 3-stage Socratic hint progression modal and feedback alerts), `ReviewQueueView.tsx`, `ExamsListView.tsx`, `ExamTakeView.tsx`, `ExamResultsView.tsx`, `ProgressView.tsx`, `ClassroomsView.tsx`, and `CourseDetailView.tsx` completely localized and polished.
- **Gate 4 (Instructor Portal & Verification):** `TeachDashboardView.tsx`, `ClassroomManagerView.tsx`, `CourseManagerView.tsx`, `ResourceManagerView.tsx`, `ContentReviewWorkspace.tsx` (fixing broken toast grammar), `InstructorAnalyticsView.tsx`, and `AdminAuditView.tsx` completely localized. All 290 tests pass, `npm run typecheck` passes with 0 errors, and production build succeeds.

---

## Detailed Task Breakdown

### Task 1: Core Brand Consistency & Backend Edge Functions Hardening
- **Target Files:**
  - `src/lib/supabaseClient.ts`
  - `src/lib/tutorClient.ts`
  - `src/worker/index.ts`
  - `src/worker/socraticFSM.ts`
  - `functions/_lib/socraticFSM.ts`
  - `functions/_lib/aiService.ts`
  - `functions/api/study/hint.ts`
  - `functions/api/study/submit-answer.ts`
  - `functions/api/resources/[id]/process.ts`
  - `functions/api/**/*.ts` (error responses)
- **Actions:**
  1. Purge every reference to `PharmIQ` and `CENNA.ai` and enforce `CENNA.live`.
  2. Localize Socratic refusal turn: `"CENNA.live yalnızca sentetik eğitim vakaları ve ders tekrarı için tasarlanmıştır..."`.
  3. Localize default 3-stage hint fallbacks in `functions/api/study/hint.ts`:
     - Stage 1: "1. Kademe: Yönlendirme ve Temel İlke" (Konunun temel farmakolojik veya klinik ilkesini göz önüne getirin; kaynak belgede belirtilen kuralları hatırlayın).
     - Stage 2: "2. Kademe: Akıl Yürütme ve Mantıksal İlişki" (Soruyu ara adımlara bölün. Verilen parametrelerden çıkarılacak ilk mantıksal sonuç nedir?).
     - Stage 3: "3. Kademe: Uygulama ve Çözüm Adımı" (Temel klinik sınırlamalar veya birimlerle çelişen seçenekleri eleyin).
  4. Localize answer submission feedback summary in `functions/api/study/submit-answer.ts`:
     - `isCorrect ? 'Tebrikler! Doğru cevap.' : 'Yanlış cevap. İlgili konuyu ve kaynak açıklamayı aşağıda inceleyin.'`
  5. Localize AI prompts and deterministic fallbacks in `functions/_lib/aiService.ts`:
     - Prompt instructs AI to author in Turkish academic terminology.
     - Deterministic fallback questions and explanations translated into authentic Turkish.
  6. Enhance `functions/api/resources/[id]/process.ts` with Turkish section defaults (`'Giriş'`) and Turkish regex markers.

### Task 2: Public Shell, Navigation, Authentication & Legal Views Localization
- **Target Files:**
  - `index.html`
  - `src/components/Navbar.tsx`
  - `src/components/Footer.tsx`
  - `src/components/ErrorBoundary.tsx`
  - `src/views/Public/LandingView.tsx`
  - `src/views/Public/AuthView.tsx`
  - `src/views/Public/FeaturesView.tsx`
  - `src/views/Public/HowItWorksView.tsx`
  - `src/views/Public/LegalView.tsx`
  - `src/views/Public/InviteRedeemView.tsx`
- **Actions:**
  1. Update `index.html`: `lang="tr"`, Turkish title and meta description.
  2. Overhaul `Navbar.tsx`: All navigation links ("Bugün", "Sınıflarım", "Aralıklı Tekrar", "Süreli Sınavlar", "Akademik Gelişim", "Eğitmen Portalı", "İçerik İnceleme & Onay", "Analitik"), role switcher ("Eğitmen Görünümüne Geç" / "Öğrenci Görünümüne Geç"), dropdown, and mobile drawer.
  3. Overhaul `Footer.tsx`: 100% Turkish pedagogy & governance links, copyright, and platform description.
  4. Overhaul `ErrorBoundary.tsx`: Turkish crash recovery screen.
  5. Completely rewrite `LandingView.tsx`: Eloquent, natural Turkish copywriting covering the 5-stage learning cycle, metrics, dual value proposition, and call to action.
  6. Completely rewrite `AuthView.tsx`: All labels ("Kurumsal E-posta", "Şifre", "Ad Soyad", "Hesap Türü"), tabs ("Giriş Yap", "Kayıt Ol", "Şifremi Sıfırla"), form validation rules, and demo buttons.
  7. Localize `FeaturesView.tsx`, `HowItWorksView.tsx`, `LegalView.tsx`, and `InviteRedeemView.tsx`.

### Task 3: Student Learning Experience & Interactive Study Polish
- **Target Files:**
  - `src/views/Student/TodayView.tsx`
  - `src/views/Student/StudySessionView.tsx`
  - `src/views/Student/ReviewQueueView.tsx`
  - `src/views/Student/ExamsListView.tsx`
  - `src/views/Student/ExamTakeView.tsx`
  - `src/views/Student/ExamResultsView.tsx`
  - `src/views/Student/ProgressView.tsx`
  - `src/views/Student/ClassroomsView.tsx`
  - `src/views/Student/CourseDetailView.tsx`
- **Actions:**
  1. Localize `TodayView.tsx`: Daily targets ("Günün Hedefi: ~25 Dakika"), student greeting, focused active session card, course cards, spaced review queue widget, mock exam card, overall mastery card.
  2. Localize `StudySessionView.tsx`: Question progress, concept provenance badge, Socratic hint button and modal ("Sokratik İpucu İlerleme Merdiveni", "1. Kademe: Yönlendirme", "2. Kademe: Akıl Yürütme", "3. Kademe: Uygulama"), numeric/single/multiple choice inputs, submit button, feedback card with mastery score and next review days, next question button.
  3. Localize `ReviewQueueView.tsx`: Table columns ("Kavram ve Ders", "Aralık Kademesi", "Kavrama Skoru", "Hata Sayısı", "İşlem"), empty states, action buttons.
  4. Localize `ExamsListView.tsx`, `ExamTakeView.tsx` (server-synced timer, question palette, flagging, autosave tag, submit confirmation modal), and `ExamResultsView.tsx` (result status, score breakdown, remediation recommendations).
  5. Localize `ProgressView.tsx`, `ClassroomsView.tsx`, and `CourseDetailView.tsx`.

### Task 4: Instructor Teaching Workspace, AI Review Gate & Quality Verification
- **Target Files:**
  - `src/views/Instructor/TeachDashboardView.tsx`
  - `src/views/Instructor/ClassroomManagerView.tsx`
  - `src/views/Instructor/CourseManagerView.tsx`
  - `src/views/Instructor/ResourceManagerView.tsx`
  - `src/views/Instructor/ContentReviewWorkspace.tsx`
  - `src/views/Instructor/InstructorAnalyticsView.tsx`
  - `src/views/Admin/AdminAuditView.tsx`
- **Actions:**
  1. Localize `TeachDashboardView.tsx`: Headers, statistics ("Sınıflar", "Dersler", "Kaynaklar", "İnceleme Bekleyenler"), quick action buttons.
  2. Localize `ClassroomManagerView.tsx` and `CourseManagerView.tsx`: Modals, student tables, invite link generator and copy alerts.
  3. Localize `ResourceManagerView.tsx`: Document upload form, semantic chunk viewer modal, processing triggers.
  4. Localize `ContentReviewWorkspace.tsx`: Fix broken toast strings (`message.success('Öğe başarıyla onaylandı')`), tabs ("İnceleme Bekleyenler", "Onaylananlar", "Yayındakiler", "Reddedilenler"), concept and question review cards, side-by-side source excerpt comparison, edit modal, reject reason modal.
  5. Localize `InstructorAnalyticsView.tsx` and `AdminAuditView.tsx`.
  6. Run `npm test` to ensure all 290 tests pass.
  7. Run `npm run typecheck` to ensure 0 TypeScript compilation errors.
  8. Run `npm run build` to verify clean production bundle generation in `dist/`.

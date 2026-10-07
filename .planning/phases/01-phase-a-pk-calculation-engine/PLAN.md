# Phase A Plan: PK & Calculation Engine Proof

## Objective
Establish the deterministic foundation of PharmIQ with:
1. Supabase schema migrations, RLS policies, and seed dataset.
2. Deterministic TypeScript Cockcroft-Gault derivation engine with 3 atomic intermediate failure nodes.
3. Socratic Finite State Machine with strict JSON schema, turn budget ($N \le 4$), and clinical guardrails.
4. Mobile-first Ant Design calculation drill workspace with intermediate scratchpad and step-level diagnosis drawer.
5. Automated Vitest suites and Cloudflare Pages/Worker deployment readiness verification.

## Execution Matrix & Quality Gates
- **Gate 1 (Agent 1):** Supabase DB initialized, RLS active, seed items loaded, TypeScript types generated.
- **Gate 2 (Agent 2):** Deterministic engine + Vitest passes with 100% test coverage on edge cases (obese female, normal male, distractor tagging).
- **Gate 3 (Agent 3):** AntD mobile drill UI renders scratchpad inputs, connects to deterministic engine, logs attempts, and triggers step-level diagnostic drawer.
- **Gate 4 (Agent 4):** Production build passes cleanly (`npm run build`), dry-run deployment succeeds (`npx wrangler pages deploy dist/ --dry-run`).

## Decisions Locked (from /grill-me session)
1. **UI Framework:** Standard Ant Design Web (antd v5.24.3) constrained to mobile width (480px) matching Section 8.
2. **DAG Scope:** Cockcroft-Gault multi-step DAG is the primary derivation engine; other seed PK items run as distractor-tagged diagnostic questions with exact numeric checking.
3. **Socratic Runtime:** Dual-mode tutor client supporting Cloudflare Worker `/api/tutor/turn` with local deterministic preceptor fallback for offline/test environments.
4. **Auth & Sessions:** Supabase Auth with quick Demo Student session for frictionless testing while respecting RLS.

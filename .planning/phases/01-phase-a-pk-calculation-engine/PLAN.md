# Phase A Plan: PK & Calculation Engine Proof (Updated with OpenRouter AI Infrastructure)

## Objective
Establish the deterministic and AI foundation of PharmIQ with:
1. **OpenRouter AI Infrastructure:** Free-tier LLMs (`meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`) and embeddings via a single drop-in `.env` key (`OPENROUTER_API_KEY`).
2. **Three-Tier Resilient Tutor Runtime:**
   - Tier 1: Cloudflare Worker `/api/tutor/turn` gateway with OpenRouter streaming/JSON parsing and clinical redirection guardrails.
   - Tier 2: Direct client-side OpenRouter fallback when running standalone PWA without worker.
   - Tier 3: Deterministic clinical preceptor fallback conforming to `SocraticTurnSchema` (3-sentence rule, `reveals_answer: false`).
3. **Deterministic Math Foundation:** TypeScript Cockcroft-Gault DAG derivation engine with 3 atomic intermediate failure nodes (`ibw_node`, `weight_selection_node`, `crcl_final_node`) and distractor misconception tagging.
4. **Pedagogical Telemetry:** Supabase database schema with Row Level Security, student attempts, hypercorrection error events, and Next-Time Rule generation.
5. **Mobile-First Workspace:** Ant Design Web (antd v5) responsive mobile workspace with scratchpad, step diagnosis drawer, preceptor dialogue chat, and Biruni University pilot branding.

## Execution Matrix & Quality Gates
- **Gate 1 (Database & Auth):** Supabase schema initialized, RLS active, seed items loaded, TypeScript types generated, one-click demo student login wired.
- **Gate 2 (Deterministic Engine & Socratic FSM):** Vitest test suite achieves 100% pass rate (edge cases: obese female, normal male, underweight, distractor tagging, and Socratic guardrails).
- **Gate 3 (UI & AI Preceptor):** AntD mobile drill UI renders scratchpad inputs, connects to deterministic engine, logs attempts to Supabase, interfaces with OpenRouter Socratic preceptor, and captures Next-Time rules on hypercorrection.
- **Gate 4 (Production Build):** `tsc --noEmit` and `npm run build` pass cleanly with static assets in `dist/`.

## OpenRouter AI Configuration Reference
- **API Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Default Free Model:** `meta-llama/llama-3.3-70b-instruct:free`
- **Fallback Free Model:** `google/gemini-2.0-flash-exp:free`
- **Embedding Model:** `text-embedding-3-small`
- **Drop-in Config:** `.env` and `.dev.vars`

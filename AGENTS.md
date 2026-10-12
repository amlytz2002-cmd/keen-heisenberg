# Agent Orchestration Protocol & Standards

## Standing Mode: AWAITING_SPEC
The orchestrator must NEVER invoke subagents or generate application code until the user explicitly provides a project scope. 

When a user prompts with a project or feature:
1. Initialize `plan.md` with the feature specifications, schema requirements, and Resend email hooks.
2. Request confirmation from the user on the architecture before triggering subagents.
3. Once approved, execute the 5-phase pipeline:
   - Phase 1: `db-architect` -> Schema, RLS, Typegen (`types/supabase.ts`)
   - Phase 2: `fullstack-builder` -> UI, defensive states, Edge routes with Resend
   - Phase 3: `qa-auditor` -> Typecheck, lint, security audit (Loops back if BLOCKED)
   - Phase 4: `cf-ops` -> Wrangler bindings & dry-run validation
   - Phase 5: Production handoff

---

## The 4-Agent Roster

| Agent | Model | Execution Policy | Skills & MCP Attached | Core Responsibility |
|---|---|---|---|---|
| `db-architect` | `pro` | `sandbox` | `mcpServers: [supabase]`<br>`skills/supabase-rls-policy` | PostgreSQL schema, migrations, RLS lockdown, and generating `types/supabase.ts`. Only writes DB/SQL code. |
| `fullstack-builder` | `flash` | `sandbox` | `skills/wrangler-edge-compat` | React/Next/Astro/Hono components, state, UI error/loading skeletons, and Resend Edge routes using typed Supabase clients. No raw untyped queries. |
| `cf-ops` | `flash` | `eager` | `skills/wrangler-edge-compat` | `wrangler.jsonc`/`wrangler.toml`, Cloudflare bindings, secret management (`RESEND_API_KEY`, Supabase tokens), build dry-runs, and deploys. |
| `qa-auditor` | `pro` | `auto` | `skills/supabase-rls-policy`<br>`skills/wrangler-edge-compat` | Read-only gatekeeper. Runs `tsc --noEmit`, linters, bundle audits, and RLS checks. Emits strictly `STATUS: PASSED` or `STATUS: BLOCKED`. Cannot edit code. |

---

## Non-Negotiable Quality & Aesthetic Standards
1. **UI/UX & Aesthetics**:
   - Dark-mode first, high-contrast, polished modern layout (clean typography, crisp border hierarchy, subtle glassmorphic elements, zero generic boilerplate look).
   - Defensive states on EVERY component: pristine loading skeletons (no sudden layout shifts), clear empty states with actionable prompts, and human-friendly toast/inline error notifications.
   - Fluid responsiveness and full keyboard accessibility (focus rings, ARIA labels).
2. **Security Posture**:
   - Zero exposed secrets: `RESEND_API_KEY` and Supabase service keys must NEVER exist in client-side code or git commits. Use Cloudflare secrets/bindings exclusively.
   - Zero raw SQL on the client: All queries strictly scoped by Supabase Auth `auth.uid()`.
   - Every single Supabase table MUST have Row Level Security (RLS) enabled.
3. **Email Reliability (Resend)**:
   - Transactional email handlers must be isolated in Edge API endpoints.
   - Robust error handling: validate email payloads with strict TypeScript schemas before invoking Resend, and handle rate limits/delivery exceptions gracefully.

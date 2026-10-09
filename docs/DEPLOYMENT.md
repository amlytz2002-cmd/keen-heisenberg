# CENNA.live Deployment & Infrastructure Guide

**Platform:** Cloudflare Pages (Frontend & Serverless Functions) + Supabase (PostgreSQL 17 & Storage)  
**Configuration File:** `wrangler.toml`  
**Output Directory:** `dist`  

---

## 1. Environment Topology

```
                  ┌─────────────────────────────────────┐
                  │          Cloudflare Pages           │
                  │  - Static Assets: dist/             │
                  │  - Edge Functions: functions/api/*  │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │              Supabase               │
                  │  - PostgreSQL 17 (Project: ibyntb...)│
                  │  - Storage Buckets (course-resources│
                  │  - Auth (Email & Password / JWT)    │
                  └─────────────────────────────────────┘
```

---

## 2. Environment Variables Configuration

The following variables must be configured in Cloudflare Pages dashboard (**Settings → Environment Variables**) or in local `.env`:

### Public Variables (Client Bundle)
| Variable | Description | Example / Target |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase API URL | `https://ibyntbynqkpkkpeoudzv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Anon JWT Key | `eyJhbGciOiJIUzI1Ni...` |

### Privileged Server Secrets (Cloudflare Edge Functions ONLY)
Never expose these variables with a `VITE_` prefix:
| Variable | Description | Usage |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged DB service role | Server-side user provisioning & audit logging |
| `OPENROUTER_API_KEY` | OpenRouter model API key | AI concept & question extraction cascade |
| `RESEND_API_KEY` | Resend transactional email key | Verification & invitation transactional emails |

---

## 3. Database Migration Deployment

All schema migrations are version-controlled in `supabase/migrations/`:
- `supabase/migrations/001_initial_schema.sql`: Foundational pedagogical schemas.
- `supabase/migrations/002_cennalive_core.sql`: CENNA.live core tables, 27 RLS policies, private storage buckets, and security definers.

### Applying Migrations via Supabase CLI
```bash
# Authenticate CLI
supabase login

# Link remote project
supabase link --project-ref ibyntbynqkpkkpeoudzv

# Push pending migrations
supabase db push
```

---

## 4. Cloudflare Pages Build & Deployment

### Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build` (runs `tsc && vite build`)
- **Build Output Directory:** `dist`
- **Node.js Version:** 18+

### Deploying via Wrangler CLI
```bash
# Preview build locally with Pages Functions emulation
npx wrangler pages dev dist

# Direct production deployment
npm run build
npx wrangler pages deploy dist --project-name cennalive-pilot
```

---

## 5. Storage Buckets Setup

The application requires two private Supabase storage buckets:
1. **`course-resources`**:
   - `public`: `false` (Private)
   - `file_size_limit`: 52,428,800 bytes (50MB)
   - `allowed_mime_types`: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`, `text/markdown`.
2. **`user-avatars`**:
   - `public`: `false` (Private)
   - `file_size_limit`: 5,242,880 bytes (5MB)
   - `allowed_mime_types`: `image/png`, `image/jpeg`, `image/webp`.

---

## 6. Health Check & Verification Commands

Following deployment, execute the verification suite:
```bash
# 1. Verify strict TypeScript compilation
npm run typecheck

# 2. Run all 290 automated unit and integration tests
npm test

# 3. Verify production asset bundle generation
npm run build
```

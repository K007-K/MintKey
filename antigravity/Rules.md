# DevPath AI — Antigravity Agent Rules

# Place this file at: your-project-root/.antigravity/rules.md

---

## 1. Project Identity

- Project Name: DevPath AI
- Type: Full-stack web application — AI-powered career targeting platform
- Owner: Karthik
- Goal: Analyze a student's GitHub, LeetCode, Resume → generate company-specific
  preparation roadmaps
- Architecture: Next.js 14 frontend + FastAPI backend + 8 open-source LLM
  agents + PostgreSQL via Supabase + HelixDB skill graph
- LLM Provider: Open-source models only via LiteLLM (Groq / Ollama) — never use
  Anthropic or OpenAI APIs

---

## 2. Tech Stack (Never Deviate From This)

### Frontend

- Framework: Next.js 14 App Router only — never use Pages Router
- Language: TypeScript — strict mode always enabled
- Styling: Tailwind CSS — utility classes only, custom theme from Tinte.dev in
  tailwind.config.ts
- State: Zustand for global/client state (sidebar, selected company, theme,
  preferences), React Query (TanStack Query v5) for all server state and API
  calls
- Charts: Recharts for standard charts (bar, radar, trend lines), D3.js for
  skill graph force-directed visualization
- Components: shadcn/ui as base layer, 21st.dev for dashboard cards and stat
  widgets, Tailark.com for full page templates (landing, onboarding, settings)
- Animations: Animate UI for score change animations, roadmap reveal effects,
  progress bar fills
- Icons: Lucide Animated — drop-in replacement for lucide-react
- Backgrounds: PatternCraft for hero section and card backgrounds
- 3D (optional): Triplex / React Three Fiber for 3D skill graph visualization
- Forms: React Hook Form + Zod for all form validation
- Auth: NextAuth.js v5 with Supabase adapter
- HTTP Client: Axios with a centralized instance in /frontend/lib/api.ts

### Backend

- Framework: FastAPI (Python 3.11+)
- All endpoints must be async/await — no synchronous route handlers
- Data validation: Pydantic v2 for all request and response models — no raw
  dicts in routes
- HTTP Client: httpx.AsyncClient() for ALL outbound API calls (GitHub REST API,
  LeetCode GraphQL scraper)
- Task Queue: Celery + Upstash Redis for background jobs (platform sync, job
  scraping, score recomputation)
- Auth Middleware: JWT validation on all protected routes using python-jose
- Rate Limiting: Redis-based rate limiter middleware — 100 req/min for public,
  1000 req/min for authenticated
- Monitoring: BetterStack for logs and uptime, Sentry for error tracking,
  OmniLens for CI/CD visibility

### LLM / Agent Layer

- Adapter: LiteLLM — this is the ONLY way to call any LLM in this project
- Default Model: groq/llama-3.3-70b-versatile (fast, free tier)
- Fallback Model: ollama/qwen2.5-coder:32b (local, when offline)
- All 8 agents live in /backend/agents/ — one file per agent
- Agents use the Agentic Loop pattern: reason → tool call → observe → repeat
  (max 3 loop iterations per agent)
- All agents share a single LiteLLM client singleton in
  agents/core/litellm_client.py
- All tool execution routes through agents/core/tool_executor.py — never call
  tools directly from agent files
- Never hardcode model names — always read from LLM_MODEL environment variable
- Agents run in parallel using asyncio.gather() wherever inputs allow
- Agent 8 (Career Coach) uses higher temperature (0.8) for natural,
  human-sounding output
- Agent 3 (Resume Parser) uses temperature 0.0 for deterministic extraction

### Database — Primary (PostgreSQL)

- Provider: Supabase (free tier: 500MB, REST API, Auth, Realtime, Storage all
  included)
- ORM: SQLAlchemy 2.0 async with Alembic for migrations
- Driver: asyncpg for connection pooling (pool_size=10)
- Never write raw string SQL — always use SQLAlchemy ORM or parameterized
  queries
- Never ALTER TABLE directly — always create a new Alembic migration file
- All migrations live in /backend/migrations/
- Use UUID primary keys (gen_random_uuid()) — never sequential integers
- Use JSONB columns for platform-specific raw data (LeetCode stats, GitHub raw)
- Always use transactions for multi-table updates (match score updates touch 3
  tables atomically)

### Database — Cache Layer (Redis)

- Provider: Upstash Redis (free tier: 10K requests/day, HTTP access, no
  persistent connection needed)
- Client: Upstash Redis HTTP client in /backend/app/core/redis.py
- Cache TTLs: GitHub data = 24hr, match scores = 1hr, job trend data = 7 days
- Cache invalidation: delete user score cache immediately after any platform
  sync completes
- Redis also serves as Celery broker for background task queue

### Database — Skill Graph (HelixDB)

- Provider: HelixDB — Rust-built graph + vector database, self-hosted via Docker
- Local: docker run -p 6969:6969 helixdb/helix:latest
- Client: helix_db Python client
- Stores: 200+ skill nodes, dependency edges (directed weighted graph), vector
  embeddings for skill similarity
- Used by: Agent 6 (Gap Finder) for dependency chain traversal
- Seed script: /helix/seed_skills.py — run once on setup
- Never query HelixDB directly from routes — always through
  agents/core/tool_executor.py

### NLP Pipeline

- Resume Parser: PyMuPDF for PDF text extraction, spaCy for NER, HuggingFace
  Inference API (free, rate-limited) for section classification
- Job Scraper: Scrapy + BeautifulSoup for LinkedIn/Indeed job descriptions
- Skill Taxonomy: /backend/nlp/skill_taxonomy.json — 500+ skills with categories
- Skill Extractor: frequency analysis against taxonomy → Skill Demand Index
  computation

### DevOps

- Containerization: Docker + Docker Compose — all services (API, Celery worker,
  Postgres, Redis, HelixDB) in docker-compose.yml
- Frontend Hosting: Vercel (free tier: 100GB bandwidth, unlimited deploys)
- Backend Hosting: Railway (free tier: 500hr/month + $5 credit)
- CI/CD: GitHub Actions — test + lint on every PR, deploy on merge to main
- CI Monitoring: OmniLens (omnilens.xyz)
- Repo Visualization: GitVizz (gitvizz.com) — for portfolio demos
- Billing (when ready): BillingSDK (billingsdk.com) — drop-in Stripe
  subscription component

---

## 3. Exact Project File Structure (Never Deviate From This)

```
devpath-ai/
├── frontend/                              # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/login/page.tsx          # GitHub OAuth login page
│   │   ├── dashboard/page.tsx             # Main dashboard (SSR)
│   │   ├── roadmap/[company]/page.tsx     # Company-specific roadmap
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth OAuth handler
│   │   │   └── sync/github/route.ts         # Trigger GitHub sync
│   ├── components/
│   │   ├── ui/                            # shadcn/ui + 21st.dev components
│   │   ├── charts/                        # Recharts + D3 visualizations
│   │   ├── roadmap/                       # Roadmap tracker components
│   │   └── skill-graph/                   # D3 force graph component
│   ├── lib/
│   │   ├── api.ts                         # React Query hooks + Axios instance
│   │   └── store.ts                       # Zustand state stores
│   └── tailwind.config.ts                 # Tailwind + custom theme from Tinte.dev
│
├── backend/                               # FastAPI Python app
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py               # Master controller — runs all agents
│   │   ├── github_analyst.py             # Agent 1
│   │   ├── dsa_analyst.py                # Agent 2
│   │   ├── resume_parser.py              # Agent 3
│   │   ├── trend_watcher.py              # Agent 4
│   │   ├── company_expert.py             # Agent 5
│   │   ├── gap_finder.py                 # Agent 6 (uses HelixDB)
│   │   ├── roadmap_builder.py            # Agent 7
│   │   ├── career_coach.py               # Agent 8
│   │   └── core/
│   │       ├── agentic_loop.py           # Shared agent loop (tool calling loop)
│   │       ├── tool_executor.py          # Central tool dispatcher
│   │       ├── litellm_client.py         # Shared LiteLLM client singleton
│   │       └── models.py                 # Pydantic models for agent I/O
│   ├── app/
│   │   ├── main.py                       # FastAPI app factory
│   │   ├── routers/
│   │   │   ├── users.py                  # User profile endpoints
│   │   │   ├── scores.py                 # Match score endpoints
│   │   │   ├── roadmap.py                # Roadmap generation endpoints
│   │   │   ├── analysis.py               # Full analysis trigger + WebSocket
│   │   │   └── trends.py                 # Skill trend endpoints
│   │   ├── services/
│   │   │   ├── scoring.py                # Weighted scoring algorithm
│   │   │   ├── skill_graph.py            # HelixDB graph operations
│   │   │   ├── roadmap_gen.py            # Roadmap generation logic
│   │   │   └── nlp_parser.py             # Resume + JD NLP pipeline
│   │   ├── repositories/
│   │   │   ├── users.py                  # Repository pattern — all user DB ops
│   │   │   └── scores.py                 # Score DB operations
│   │   ├── models/
│   │   │   ├── db.py                     # SQLAlchemy models (ORM)
│   │   │   └── schemas.py                # Pydantic DTOs
│   │   ├── middleware/
│   │   │   ├── auth.py                   # JWT validation middleware
│   │   │   ├── rate_limit.py             # Redis rate limiter
│   │   │   └── logging.py                # Structured logging
│   │   └── core/
│   │       ├── config.py                 # Settings from .env (pydantic-settings)
│   │       ├── database.py               # SQLAlchemy async engine + pool
│   │       └── redis.py                  # Upstash Redis client
│   ├── tasks/
│   │   ├── celery_app.py                 # Celery configuration
│   │   ├── sync_tasks.py                 # Platform sync background tasks
│   │   ├── scraping_tasks.py             # Job scraping cron tasks
│   │   └── scoring_tasks.py              # Score recomputation tasks
│   ├── scrapers/
│   │   ├── github_scraper.py             # GitHub REST API client
│   │   ├── leetcode_scraper.py           # LeetCode GraphQL client
│   │   └── jobs_spider.py                # Scrapy spider for job trends
│   ├── nlp/
│   │   ├── resume_parser.py              # spaCy + HuggingFace resume parser
│   │   ├── skill_extractor.py            # Skill taxonomy matcher
│   │   └── skill_taxonomy.json           # 500+ skills with categories
│   ├── tests/
│   │   ├── test_agents/
│   │   │   ├── test_github_analyst.py
│   │   │   ├── test_orchestrator.py
│   │   │   └── conftest.py
│   │   └── test_tools/
│   │       └── test_tool_executor.py
│   ├── migrations/                        # Alembic database migrations
│   ├── Dockerfile
│   └── requirements.txt
│
├── helix/
│   └── seed_skills.py                     # Seed 200 skill nodes + dependency edges
│
├── .github/
│   └── workflows/
│       ├── ci.yml                         # Test + lint on every PR
│       └── deploy.yml                     # Deploy on merge to main
│
├── .antigravity/
│   └── rules.md                           # This file
├── docker-compose.yml                     # Local dev: all services
├── railway.toml                           # Railway deployment config
├── .env                                   # Never commit this
├── .env.example                           # Committed — template without real values
└── .gitignore
```

---

## 4. Environment Variables

- Always read secrets from environment variables — never hardcode any key, URL,
  or token
- Use pydantic-settings in FastAPI (app/core/config.py) and Next.js built-in
  .env.local in frontend
- If a new secret is needed, add it to .env AND .env.example (with placeholder
  value) — tell me before adding

### Required ENV Variables

```
# Supabase (get from supabase.com dashboard)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres

# LLM — open-source only (no Anthropic/OpenAI)
GROQ_API_KEY=gsk_xxxx
GROQ_BASE_URL=https://api.groq.com/openai/v1
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=groq/llama-3.3-70b-versatile

# GitHub API (for scraping user repos — create at github.com/settings/tokens)
GITHUB_TOKEN=ghp_xxxx

# Auth
JWT_SECRET=your-super-secret-key
NEXTAUTH_SECRET=xxxx
NEXTAUTH_URL=http://localhost:3000

# Redis — Upstash (get from upstash.com)
REDIS_URL=rediss://default:xxxx@xxxx.upstash.io:6380

# HelixDB — local Docker
HELIX_URL=http://localhost:6969

# Email notifications — Resend (resend.com — 3K emails/month free)
RESEND_API_KEY=re_xxxx

# Frontend public (exposed to browser — no secrets)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 5. The 8 Agents — Exact Specification

| Agent                       | File               | Input                                                                    | Output                                                                                          | Notes                                                 |
| --------------------------- | ------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| GitHub Intelligence Analyst | github_analyst.py  | GitHub username                                                          | project_depth_score, engineering_maturity_index, language_distribution, key_weaknesses          | Uses fetch_github_repos + fetch_repo_details tools    |
| DSA Performance Analyst     | dsa_analyst.py     | LeetCode stats dict                                                      | dsa_depth_score, topic_weakness_map, interview_readiness per company, easy_reliance_flag        | No external tools — pure LLM analysis                 |
| Resume Intelligence Parser  | resume_parser.py   | Raw resume text                                                          | structured skill graph JSON, resume_strength_score, academic_eligibility_matrix                 | Temperature 0.0, no tools — pure NLP extraction       |
| Market Trend Intelligence   | trend_watcher.py   | target_company + user_stack list                                         | market_required_skills, user_missing_skills, rising_skills, gap_alert                           | Uses web search tool for live job data                |
| Company Blueprint Expert    | company_expert.py  | company name + user summary                                              | full company hiring blueprint, DSA thresholds, interview format, required stack                 | Uses fetch_company_blueprint DB tool + web search     |
| Skill Gap Analyzer          | gap_finder.py      | user_skills + required_skills + graph_data                               | prioritized gaps: BLOCKING / IMPORTANT / NICE_TO_HAVE with full dependency chains               | Uses query_skill_graph tool (HelixDB traversal)       |
| Roadmap Generator           | roadmap_builder.py | gap_analysis + dsa_analysis + company_blueprint + months + hours_per_day | week-by-week JSON array: theme, tasks, problem counts, resources, milestone                     | Depends on Agents 2, 5, 6 finishing first             |
| AI Career Coach             | career_coach.py    | Full merged analysis from all 7 agents                                   | 400-word coaching message: current state, top 3 actions, timeline, today's task, hidden insight | Temperature 0.8, no tools, receives all agent outputs |

### Agent Execution Order (Orchestrator)

- Phase 1 — Parallel: Agents 1, 2, 3, 4, 5 fire simultaneously via
  asyncio.gather()
- Phase 2 — Sequential: Agent 6 (needs outputs from 1, 2, 5), Agent 7 (needs
  output from 6), Agent 8 (needs all outputs)
- All tool calls route through agents/core/tool_executor.py — never call DB or
  HelixDB directly from agent files
- return_exceptions=True in asyncio.gather() — if one agent fails, others still
  complete
- Failed agent outputs default to empty dict {} — system continues with partial
  data

---

## 6. Code Quality Rules

- Use absolute imports everywhere — never relative imports like ../../utils
- Every FastAPI route must have a Pydantic request model AND a response model in
  models/schemas.py
- Every async function must have try/except with proper error logging
- No print() statements — use Python logging module (backend), console.error
  (frontend)
- All TypeScript files must have explicit types — no `any` types allowed
- All React components must be functional components with typed props interfaces
- API response format is always:
  `{ success: bool, data: any, error: string | null }`
- Every new file must have a one-line comment at the top describing what it does
- Repository pattern: routes never write SQL — all DB access goes through
  /repositories/
- Service layer: business logic lives in /services/ — routes only handle HTTP,
  never business logic

---

## 7. Build Rules

- Build ONE feature at a time — never attempt multiple features in a single run
- Always output a brief Implementation Plan in chat before writing any code
- Build order per feature: Alembic migration → SQLAlchemy model → Pydantic
  schema → Repository → Service → Route → Frontend component
- After finishing each feature, show what was built and wait for my approval
  before continuing
- If anything in the spec is ambiguous, stop and ask — do not assume
- Do not install any new npm or pip package without asking me first and
  explaining why it's needed

---

## 8. Git Rules (Automatic — Do This After Every Build or Fix)

### Commit After Every Completed Feature or Fix

- Stage all relevant changed files
- Check git status first — do not stage unrelated changed files
- Write a descriptive commit message using this exact format:
  - New feature: `feat(scope): short description`
  - Bug fix: `fix(scope): short description`
  - Database change: `db(migration): short description`
  - UI change: `ui(page-name): short description`
  - Agent change: `agent(agent-name): short description`
  - Config/infra: `chore(config): short description`

### Commit Message Examples

```
feat(github-agent): add repo complexity scoring with tool executor
fix(dashboard): fix recharts radar chart tooltip overflow
db(migration): add skill_gaps table with priority enum
ui(roadmap-page): add week-by-week timeline with Animate UI
agent(gap-finder): wire HelixDB dependency chain traversal
chore(docker): add HelixDB service to docker-compose
```

### Push Rules

- Push to origin after every commit — automatically, without being asked
- Default branch is `main` for all stable working code
- Create a feature branch for anything risky or experimental
  - Branch naming: `feature/agent-github`, `fix/dashboard-chart`,
    `db/skill-gaps-table`
- Never push directly to main if a feature branch is active — PR and merge first
- Never force push to main

### What to Never Commit

```
.env
.env.local
.env.production
node_modules/
__pycache__/
*.pyc
.next/
dist/
*.log
.DS_Store
```

---

## 9. UI Rules

- Build one page at a time — never all pages in a single run
- Page build order: Landing → Auth (login) → Onboarding → Dashboard → Company
  Blueprint → Roadmap → Career Coach
- After each page is built, generate a screenshot artifact for my review before
  moving to the next
- Global shared components go in /frontend/components/ui/ — build these first,
  then reuse
- Design tokens: color system and typography scale are defined in the UI spec —
  use them via Tailwind config
- All pages must be fully responsive — mobile first, Tailwind breakpoints (sm,
  md, lg, xl)
- Dark mode required on all pages — use Tailwind dark: classes
- No inline styles — Tailwind classes only
- Loading states: skeleton loaders on every data-fetching component — never
  spinners
- Error states: every component that makes an API call must handle error state
  visibly
- Component sources: shadcn/ui base → customize with Tailwind → supplement with
  21st.dev widgets and Tailark templates

---

## 10. Testing Rules

- Do NOT write automated tests — I will test everything manually
- Do NOT run pytest or Jest automatically
- After each completed feature, give me a manual test checklist: what to click,
  what to check, what the expected output is

---

## 11. What You Must Never Do

- Never use Anthropic Claude API or OpenAI API — open-source LLMs only via
  LiteLLM
- Never build more than one feature per session without my explicit approval
- Never install npm or pip packages without asking me first
- Never use Pages Router in Next.js — App Router only
- Never write synchronous FastAPI route handlers — async only
- Never hardcode any secret, key, token, or URL — env variables always
- Never ALTER TABLE directly — always create an Alembic migration
- Never commit .env, node_modules, or **pycache**
- Never skip writing the Implementation Plan before coding
- Never call DB or HelixDB directly from agent files — always route through
  tool_executor.py
- Never assume what I want when something is unclear — stop and ask me

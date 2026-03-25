# MintKey — Complete Implementation Plan

### From Current State to Production

> **Generated**: March 17, 2026 | **Last Updated**: March 25, 2026 (v5 —
> honest audit update)\
> **Owner**: Karthik\
> **Status**: Living document — updated as we build\
> **LLM Provider**: Open-source only via LiteLLM (Groq `llama-3.3-70b-versatile` / Ollama fallback) — never Anthropic or OpenAI

---

## Part 1: Where We Are Today

### What's Done (Phase 1–4) — Audit-Verified Status

| Phase       | What                                                                                                                                                                                           | Status      | Audit Reality |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------- |
| **Phase 1** | Backend skeleton: FastAPI, 12 routers, 3 middleware, SQLAlchemy ORM (11 tables), Alembic migrations, LiteLLM client, Pydantic schemas, Docker Compose, GitHub OAuth                            | ⚠️ 85% | Code exists. 2 of 12 routers (`roadmap.py`, `trends.py`) are empty stubs |
| **Phase 2** | GitHub REST scraper, LeetCode GraphQL scraper, CodeChef scraper, HackerRank scraper, Resume PDF parser, Skill taxonomy (150+), Celery + Redis task queue                                       | ⚠️ 70% | Code written, **0% integration-tested** with real user accounts |
| **Phase 3** | 8 LLM agents (72-98 lines each), Orchestrator, Tool executor (9 tools), WebSocket progress, agentic loop                                                                                      | ⚠️ 70% | Code written, **never triggered from UI end-to-end** |
| **Phase 4** | Weighted scoring algorithm (7 components), 15 company blueprints, HelixDB skill graph (200+ nodes), Gap analysis + topological sort, Match score computation                                   | ⚠️ 65% | Algorithm implemented, **never run with real agent data**. HelixDB seed status unknown |

### Frontend Pages — Audit-Verified Status

| Page              | Lines | Status    | Audit Reality                                                       |
| ----------------- | ----- | --------- | ------------------------------------------------------------------- |
| `/dashboard`      | 935   | ⚠️ 50%   | Wired to backend, but shows **empty/zero data** — no analysis has ever run, so DB is empty |
| `/profile`        | —     | ✅ 100%   | Edit profile modal, platform usernames, avatar — **genuinely complete** |
| `/settings`       | —     | ✅ 100%   | Export PDF, clear cache, delete account — **genuinely complete**     |
| `/onboarding`     | —     | ⚠️ 80%   | Multi-step wizard exists, **unverified** if data saves correctly    |
| `/` (Landing)     | —     | ✅ 100%   | Landing page — **genuinely complete**                               |
| `/practice`       | 470   | ⚠️ 60%   | 1134 problems, basic filters work — **12 features missing** (see below) |
| `/practice/[id]`  | 244   | ⚠️ 40%   | Page renders, but **all content NULL** in DB (desc, hints, solutions never enriched) |
| `/dsa`            | 5     | ✅ 100%   | Redirects to `/practice` — **genuinely complete**                   |

### 🔶 What's Built But Uses Static/Mock Data

| Page              | Lines | Status    | Details                                                             |
| ----------------- | ----- | --------- | ------------------------------------------------------------------- |
| `/companies`      | 381   | 🔶 Static | UI designed but data is mock, not wired to backend                  |
| `/company/[slug]` | 1627  | 🔶 Static | Company detail page, tabs show hardcoded mock data                  |
| `/match/[slug]`   | 800   | 🔶 Static | Match report UI built, uses mock data                               |
| `/roadmap`        | 278   | 🔶 Static | Roadmap list page, uses mock data                                   |
| `/roadmap/[slug]` | 786   | 🔶 Static | Company-specific roadmap, uses mock data                            |

### 🔲 Placeholder Pages (< 70 lines, scaffold only)

| Page              | Lines | Current State                                                         |
| ----------------- | ----- | --------------------------------------------------------------------- |
| `/coach`          | 55    | Static scaffold — hardcoded coach message + chat input (not wired)    |
| `/simulate`       | 62    | Placeholder — basic slider UI skeleton                                |
| `/trends`         | 58    | Placeholder — basic layout skeleton                                   |
| `/skills`         | 48    | Placeholder — empty shell                                             |

### 🔲 Pages Not Yet Created

| Page            | Status                         |
| --------------- | ------------------------------ |
| `/visualizer`   | No page exists                 |
| `/aptitude`     | No page exists                 |
| `/projects`     | No page exists                 |
| `/patterns`     | No page exists                 |
| `/cheatsheets`  | No page exists                 |
| `/resources`    | No page exists                 |
| `/courses`      | No page exists                 |

### Current Database Schema (12 Tables)

```
users                     → User profiles + platform usernames
platform_scores           → Synced GitHub/LC/CC/HR data + computed scores
company_blueprints        → 15 company hiring blueprints (JSONB)
company_match_scores      → User vs company match scores (time-series)
user_target_companies     → Which companies user is targeting (max 5)
user_skill_gaps           → Identified gaps per user per company
user_roadmaps             → Generated week-by-week roadmap data
analysis_results          → Full 8-agent analysis output storage
user_dsa_progress         → DSA tracker progress per user
external_problems          → 1134 seeded problems (NeetCode/Striver/CSES/Blind75)
user_problem_progress     → Per-user problem solving status + timestamps
```

### Current Backend Routers (12)

```
auth.py          → GitHub OAuth login/callback
users.py         → GET/PATCH user profile
dashboard.py     → Dashboard stats aggregation endpoint
companies.py     → GET company blueprints list + detail
scores.py        → POST compute match scores, GET scores
analysis.py      → POST trigger analysis, GET status, WebSocket
sync.py          → POST sync GitHub/LC/CC/HR
practice.py      → Problem listing, filtering, progress tracking (6 endpoints) ✅ NEW
dsa.py           → DSA tracker endpoints ✅ NEW
roadmap.py       → Placeholder (empty)
trends.py        → Placeholder (empty)
```

### Current Agents (8 — all use LiteLLM with Groq)

```
github_analyst.py    → Agent 1: GitHub profile scoring (temp 0.2)
dsa_analyst.py       → Agent 2: LeetCode/DSA analysis (temp 0.1)
resume_parser.py     → Agent 3: Resume extraction (temp 0.0)
trend_watcher.py     → Agent 4: Market trend intelligence
company_expert.py    → Agent 5: Company blueprints
gap_finder.py        → Agent 6: Skill gap analysis (HelixDB)
roadmap_builder.py   → Agent 7: Week-by-week roadmap generation
career_coach.py      → Agent 8: AI Career Coach (temp 0.8)
orchestrator.py      → Master controller — runs all agents
```

> **LLM Provider**: All agents use `agents/core/litellm_client.py` singleton.
> Default: `groq/llama-3.3-70b-versatile`. Fallback: `ollama/qwen2.5-coder:32b`.
> Model read from `LLM_MODEL` env var. **Never Anthropic or OpenAI.**

### Current Sidebar Navigation (audit-verified)

```
PLATFORM:
  Dashboard         → ⚠️ Wired but shows empty data (no pipeline run yet)
  Companies         → 🔶 UI built, mock data
  My Roadmap        → 🔶 UI built, mock data
  DSA Practice      → ⚠️ Partially wired (works, 12 features missing)
  Skill Graph       → 🔲 Placeholder (48 lines)

INTELLIGENCE:
  Market Trends     → 🔲 Placeholder (58 lines)
  Career Simulator  → 🔲 Placeholder (62 lines)
  AI Coach [BETA]   → 🔲 Placeholder (55 lines)

BOTTOM:
  Profile           → ✅ Complete
  Settings          → ✅ Complete
```

### Frontend Page Ownership (Audit-Verified)

| Page | Lines | Designed By | Audit Status | Notes |
|------|-------|-------------|-------------|-------|
| `/` (Landing) | — | Karthik | ✅ 100% Done | — |
| `(auth)/login` | — | Karthik | ✅ 100% Done | — |
| `/onboarding` | — | Karthik | ⚠️ 80% | Exists, needs e2e verification |
| `/dashboard` | 935 | Karthik | ⚠️ 50% | Wired to backend but shows empty data (pipeline never run) |
| `/companies` | 381 | Karthik | 🔶 Mock | Sprint 1 wiring |
| `/company/[slug]` | 1627 | Karthik | 🔶 Mock | Sprint 1 wiring |
| `/match/[slug]` | 800 | Karthik | 🔶 Mock | ⚠️ Needs redesign + wiring |
| `/roadmap/[slug]` | 786 | Karthik | 🔶 Mock | ⚠️ Needs redesign + wiring |
| `/practice` | 470 | Karthik | ⚠️ 60% | Works, but 12 features missing (see below) |
| `/profile` | — | Karthik | ✅ 100% Done | — |
| `/settings` | — | Karthik | ✅ 100% Done | — |
| `/roadmap` | 278 | Agent | 🔶 Mock | List page, needs design |
| `/practice/[id]` | 244 | Agent | ⚠️ 40% | Page renders but all content fields NULL in DB |
| `/coach` | 55 | Agent | 🔲 Placeholder | Needs UX Pilot mockup |
| `/simulate` | 62 | Agent | 🔲 Placeholder | Needs UX Pilot mockup |
| `/trends` | 58 | Agent | 🔲 Placeholder | Needs UX Pilot mockup |
| `/skills` | 48 | Agent | 🔲 Placeholder | Needs UX Pilot mockup |
| `/dsa` | 5 | Agent | ✅ 100% Done | Redirects to /practice |

> **3 pages need redesign**: `/match/[slug]`, `/roadmap/[slug]`, `/practice`
> — Karthik to generate updated UX Pilot mockups before agent rebuilds them.

### `/practice` Page — 12 Missing Features

| # | Feature | Impact | Effort |
|---|---------|--------|--------|
| 1 | No topic/tag filter (Arrays, DP, Trees, etc.) | 🔴 High | Small |
| 2 | No company tag filter (Google, Amazon problems) | 🔴 High | Small |
| 3 | No "Show solved/unsolved only" toggle | 🟡 Medium | Small |
| 4 | Study plan progress bars stuck at 0% (no per-plan solved count) | 🟡 Medium | Medium |
| 5 | Problem detail page empty (desc, hints, solution all NULL in DB) | 🔴 High | Large |
| 6 | No clickable problem titles → `/practice/[id]` | 🟡 Medium | Tiny |
| 7 | No sorting (by difficulty, #, or solved status) | 🟡 Medium | Small |
| 8 | No pattern/category filter (Sliding Window, Two Pointers) | 🟡 Medium | Small |
| 9 | Subtitle says "~800 problems" but there are 1134 | 🟢 Low | Tiny |
| 10 | No bookmark/save feature | 🟢 Low | Medium |
| 11 | No notes per problem (schema supports, no UI) | 🟢 Low | Medium |
| 12 | No dark mode (`dark:` classes missing) | 🟢 Low | Medium |

### Critical Pipeline Gap

> ⚠️ **The end-to-end analysis pipeline has never been triggered:**
> ```
> User clicks "Analyze" → Orchestrator → 8 Agents → Scoring → DB → Dashboard
> ```
> Every piece exists individually (agents ✅, scoring ✅, DB tables ✅, dashboard ✅),
> but **they have never been connected and executed together**. This is why the
> dashboard shows zeros and the match pages have no real data.
>
> **Overall honest completion: ~45-50%** (not the ~70% the previous ✅ marks suggested)

### Strategic Decisions (from cross-check against all 3 spec docs)

| Product Spec Feature | Decision | Rationale |
|---------------------|----------|----------|
| Module 10: Smart Recommendations | **Fold into AI Coach** | Coach page will surface stack pivots, company suggestions, timing alerts. No separate page. |
| Module 8.3: Smart Notifications | **Defer to v2** | Coach "first load" message replaces push notifications for now. |
| Module 3.2: Project Maturity Score | **Surface on Dashboard** | Agent 1 already computes it — add one stat card to dashboard. |
| Module 9: Full Career Trajectory | **Keep as simple what-if** | Students need placement first. 5-year arc simulation is overkill for MVP. |
| Module 3.3: Burnout Detection | **Simple activity alert** | "Activity dropped 60% this week" in stats is enough. No ML model. |
| Module 3.3: Night Owl pattern | **Cut** | Gimmick — nobody changes study time because an app says so. |
| `jobs_spider.py` Scrapy scraper | **Cut** | LinkedIn/Indeed block scrapers. Use curated `skill_taxonomy.json` data instead. |
| 3 PG tables (skills, skill_deps, user_skills) | **Cut** | HelixDB handles this. No PostgreSQL fallback — fail gracefully instead. |
| Peer Benchmarking | **Defer to v2** | Needs thousands of users to be meaningful. |
| Algorithm Visualizer (28 algos) | **Reduce to 5 core** | Nice-to-have, not a differentiator. NeetCode videos do this better. |

> **LLM Provider Note**: The `DevPath_AI_MultiAgent_Architecture.docx` uses
> Anthropic/Claude API throughout — this is for reference architecture only.
> All agents in our codebase use **LiteLLM with Groq** (`llama-3.3-70b-versatile`).
> The agentic loop pattern is identical — only the API client differs.

---

## Part 2: What's Changing — The New MintKey Vision

### Old Vision vs New Vision

| Aspect                 | Old Plan               | New Plan                                              |
| ---------------------- | ---------------------- | ----------------------------------------------------- |
| **Problem solving**    | Build inside MintKey   | Redirect to LeetCode/CodeChef                         |
| **Content**            | Link to external sites | Build natively from 10 unrecognized sources           |
| **Algorithm learning** | None planned           | Full animated visualizer (AlgoMaster-style)           |
| **Aptitude prep**      | None planned           | LLM-powered quiz engine (replaces IndiaBix/PrepInsta) |
| **Project learning**   | None planned           | Project challenge hub (from CodingChallenges.fyi)     |
| **DSA roadmaps**       | User creates own       | Import NeetCode/Striver's curated sheets              |
| **Problem database**   | Only LC sync           | Import CSES 300 problems + curated sets natively      |
| **Explanations**       | None planned           | LLM-generated per-problem explanations                |
| **Courses**            | None planned           | Display FCC/TOP curricula, redirect for completion    |
| **Patterns library**   | None planned           | DSA patterns reference (from RisingBrain)             |
| **Cheat sheets**       | None planned           | Built-in quick reference cards                        |

### Sidebar Navigation — Updated (future target)

```
PLATFORM:
  Dashboard           → ✅ Done
  Companies           → 🔧 Needs backend wiring (Sprint 1)
  My Roadmap          → 🔧 Needs backend wiring + redesign (Sprint 1)

LEARN:
  DSA Practice        → ✅ Wired — needs redesign + enrichment
  Aptitude            → 🔨 NEW (Sprint 4)
  Courses             → 🔨 NEW (Sprint 5)
  Projects            → 🔨 NEW (Sprint 8)
  [Visualizer]        → 🔨 NEW (Sprint 7) — reduced to 5 core algos
  [Patterns]          → 🔨 NEW (Sprint 7)

PREPARE:
  Skill Graph         → 🔨 Placeholder → build (Sprint 6)
  AI Coach [BETA]     → 🔨 Placeholder → build (Sprint 3)
                        (folds in Module 10 recommendations)

BOTTOM:
  Resources           → 🔨 NEW (Sprint 5)
  [Cheatsheets]       → 🔨 NEW (Sprint 8)
  Profile             → ✅ Done
  Settings            → ✅ Done
```

> **Removed from sidebar**: Market Trends (data from Coach instead),
> Career Simulator (deprioritized, accessible via direct URL).
> **Total sidebar items**: 14 (currently 10, adding 4 as built).
>
> **Note**: The old `/dsa` (DSA Tracker) route is **replaced** by `/practice`
> (DSA Practice). `/dsa` redirects to `/practice`.

---

## Part 3: New Database Tables Required

### Migration 1: `external_problems`

```sql
CREATE TABLE external_problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL,                    -- 'cses', 'neetcode', 'striver', 'custom'
    external_id TEXT,                        -- Platform-specific ID
    title TEXT NOT NULL,
    slug TEXT,
    difficulty TEXT,                         -- 'easy', 'medium', 'hard' or '1'-'5'
    tags TEXT[],                             -- ['array', 'dp', 'two-pointers']
    description TEXT,                        -- Problem statement
    url TEXT,                                -- Original URL (or NULL if native)
    category TEXT,                           -- 'dsa', 'competitive', 'math'
    study_plans TEXT[],                      -- ['neetcode_150', 'blind_75', 'striver_sde']
    company_tags TEXT[],                     -- ['google', 'amazon']
    hints TEXT[],                            -- Progressive hints
    solution_approach TEXT,                  -- LLM-generated approach text
    solution_code JSONB,                     -- { python: "...", java: "...", cpp: "..." }
    complexity_analysis TEXT,                -- "Time: O(n), Space: O(1)"
    pattern TEXT,                            -- 'sliding_window', 'two_pointers'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_problems_source ON external_problems(source);
CREATE INDEX idx_problems_difficulty ON external_problems(difficulty);
CREATE INDEX idx_problems_pattern ON external_problems(pattern);
```

### Migration 2: `user_problem_progress`

```sql
CREATE TABLE user_problem_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES external_problems(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'unsolved',          -- 'unsolved', 'attempted', 'solved'
    solved_at TIMESTAMPTZ,
    time_spent_sec INTEGER,                  -- How long user spent before solving
    attempts_count INTEGER DEFAULT 0,        -- How many times they tried
    notes TEXT,
    UNIQUE(user_id, problem_id)
);
CREATE INDEX idx_progress_user ON user_problem_progress(user_id);
```

### Migration 3: `external_courses`

```sql
CREATE TABLE external_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL,                    -- 'freecodecamp', 'odin_project'
    title TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    url TEXT NOT NULL,                       -- Redirect URL
    path TEXT,                               -- 'foundations', 'javascript'
    total_lessons INTEGER,
    category TEXT,                           -- 'web_dev', 'python', 'data_science'
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Migration 4: `user_course_progress`

```sql
CREATE TABLE user_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES external_courses(id) ON DELETE CASCADE,
    lessons_completed INTEGER DEFAULT 0,
    completed_lesson_ids TEXT[],              -- ['html-elements', 'css-selectors', ...]
    status TEXT DEFAULT 'not_started',       -- 'not_started', 'in_progress', 'completed'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);
```

> **Why `completed_lesson_ids TEXT[]`?** A count alone (`lessons_completed = 3`)
> doesn't tell us WHICH 3 lessons were done. With the array, when a user returns
> after a month, we can show exactly which lessons they completed and which
> remain.

### Migration 5: `aptitude_question_bank` + `aptitude_attempts`

```sql
-- Pre-generated question bank (NOT per-request LLM calls)
-- Generate 500-1000 questions via LLM ONCE, store in DB, serve randomly
-- Cost: ~$2 total generation vs $15-30/day if calling LLM per quiz
CREATE TABLE aptitude_question_bank (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,                  -- 'quantitative', 'logical', 'verbal', 'data_interpretation'
    topic TEXT NOT NULL,                     -- 'percentages', 'puzzles', 'coding_decoding'
    company_context TEXT,                    -- 'tcs', 'infosys' or NULL (generic)
    difficulty INTEGER DEFAULT 3,            -- 1-5
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,                  -- ["option_a", "option_b", "option_c", "option_d"]
    correct_answer INTEGER NOT NULL,         -- 0-3 index
    explanation TEXT NOT NULL,               -- Step-by-step solution
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_aptitude_bank_category ON aptitude_question_bank(category);
CREATE INDEX idx_aptitude_bank_topic ON aptitude_question_bank(topic);
CREATE INDEX idx_aptitude_bank_company ON aptitude_question_bank(company_context);

CREATE TABLE aptitude_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    topic TEXT,
    company_context TEXT,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    accuracy FLOAT NOT NULL,
    question_ids UUID[],                     -- References to aptitude_question_bank
    user_answers JSONB,                      -- { question_id: selected_answer_index }
    attempted_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_aptitude_user ON aptitude_attempts(user_id);
```

> **Cost fix**: Instead of calling the LLM per quiz request (~$0.05-0.10 each),
> we generate the entire question bank ONCE using a seed script. Serving from DB
> costs $0. The LLM is only called at content-generation time, never at
> user-request time.

### Migration 6: `curated_resources`

```sql
CREATE TABLE curated_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL,                    -- 'algomaster', 'risingbrain', etc.
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT,                           -- 'article', 'video', 'tool', 'cheat_sheet'
    topic TEXT,                              -- 'dp', 'system_design', 'web_dev'
    tags TEXT[],
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 4: New Backend Files Required

### New Scrapers / Importers

```
backend/scrapers/
├── github_scraper.py          ← EXISTS
├── leetcode_scraper.py        ← EXISTS (enhance with problem data)
├── codechef_scraper.py        ← EXISTS
├── hackerrank_scraper.py      ← EXISTS
├── cses_importer.py           ← NEW: Import 300 problems from HuggingFace JSON
├── neetcode_importer.py       ← NEW: Import NeetCode 150/250/Blind75 from GitHub
├── striver_importer.py        ← NEW: Import SDE Sheet + A2Z from GitHub
├── fcc_importer.py            ← NEW: Parse FreeCodeCamp curriculum JSON
├── odin_importer.py           ← NEW: Parse Odin Project curriculum markdown
└── challenges_scraper.py      ← NEW: Scrape codingchallenges.fyi project list
```

### New Routers

```
backend/app/routers/
├── auth.py            ← EXISTS
├── users.py           ← EXISTS
├── dashboard.py       ← EXISTS
├── companies.py       ← EXISTS (needs subpage endpoints)
├── scores.py          ← EXISTS
├── analysis.py        ← EXISTS
├── sync.py            ← EXISTS
├── roadmap.py         ← EXISTS (placeholder → needs full implementation)
├── trends.py          ← EXISTS (placeholder → needs implementation)
├── practice.py        ← NEW: Problem CRUD, progress tracking, study plans
├── courses.py         ← NEW: Course catalog, progress tracking
├── aptitude.py        ← NEW: Serve from question bank, submit answers, analytics
├── coach.py           ← NEW: AI Coach chat endpoint
└── resources.py       ← NEW: Curated resources CRUD
```

> **Note**: No `visualizer.py` router — the algorithm visualizer is 100%
> frontend-only (D3.js + React).

### New Services

```
backend/app/services/
├── scoring.py             ← EXISTS
├── seed_companies.py      ← EXISTS
├── skill_graph.py         ← EXISTS
├── problem_service.py     ← NEW: Problem search, filter, study plan logic
├── course_service.py      ← NEW: Course catalog + progress logic
├── aptitude_service.py    ← NEW: Serve questions from bank + scoring
└── explanation_service.py ← NEW: LLM problem explanations
```

### New Repositories

```
backend/app/repositories/
├── users.py           ← EXISTS
├── companies.py       ← EXISTS
├── scores.py          ← EXISTS
├── problems.py        ← NEW: external_problems + user_problem_progress
├── courses.py         ← NEW: external_courses + user_course_progress
├── aptitude.py        ← NEW: aptitude_attempts
└── resources.py       ← NEW: curated_resources
```

### New/Modified Agent

```
backend/agents/
├── [all 8 existing agents] ← EXISTS, no changes
├── core/models.py          ← ADD ExplanationInput/Output schemas
└── explanation_agent.py    ← NEW: Agent 9 — generates problem explanations
```

### New Seed Scripts

```
backend/scripts/
├── seed_problems.py         ← NEW: Run all importers, populate external_problems
├── seed_courses.py          ← NEW: Import FCC + TOP curricula
├── seed_resources.py        ← NEW: Insert curated resource links
├── seed_aptitude.py         ← NEW: LLM-generate 500-1000 aptitude questions ONCE
└── generate_explanations.py ← NEW: LLM-generate explanations for TOP 200 problems only
```

> **`generate_explanations.py` scope**: Generate for NeetCode 150 + CSES top 50
> by difficulty = **200 problems** (~$10 total). Remaining ~600 problems use
> on-demand Agent 9 at runtime (cached after first call, never re-generated). Do
> NOT run against all 800 — dedup guard prevents double-generation but costs add
> up.

---

## Part 5: New Frontend Pages

### Updated Sidebar Navigation Code

```typescript
const PLATFORM_NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/companies", label: "Companies", Icon: Building2 },
  { href: "/roadmap", label: "My Roadmap", Icon: Map },
];

const LEARN_NAV = [
  { href: "/practice", label: "DSA Practice", Icon: Code2 },
  { href: "/visualizer", label: "Visualizer", Icon: Play },
  { href: "/patterns", label: "DSA Patterns", Icon: Layers },
  { href: "/courses", label: "Courses", Icon: BookOpen },
  { href: "/projects", label: "Projects", Icon: Hammer },
];

const PREPARE_NAV = [
  { href: "/aptitude", label: "Aptitude Prep", Icon: Brain },
  { href: "/skills", label: "Skill Graph", Icon: GitBranch },
  { href: "/coach", label: "AI Coach", Icon: Sparkles, badge: "BETA" },
];
```

> **`/dsa` → `/practice` redirect**: The old `/dsa` route ("DSA Tracker" in the
> original sidebar) is superseded by `/practice`. Add a one-line redirect in
> `app/dsa/page.tsx`:
>
> ```typescript
> import { redirect } from "next/navigation";
> export default function DSAPage() {
>   redirect("/practice");
> }
> ```

### Page-by-Page Specification

#### 1. `/practice` — DSA Practice Hub (NEW)

**Data source**: `external_problems` table (seeded from CSES + NeetCode +
Striver's)

**Page layout**:

- Top: Filter bar (source, difficulty, pattern, study plan, company tag, solved
  status)
- Main: Problem table/grid (title, difficulty badge, tags, status, "Explain"
  button, "Solve ↗" link)
- Sidebar: Study plan selector (NeetCode 150, Blind 75, Striver's SDE, CSES,
  etc.)
- Bottom: Progress stats (X/150 solved, % by difficulty, streak)

**API calls**:

- `GET /api/practice/problems?plan=neetcode_150&difficulty=medium&pattern=sliding_window`
- `PATCH /api/practice/progress/{problem_id}` → mark solved/unsolved
- `GET /api/practice/stats` → user progress summary
- `POST /api/practice/explain/{problem_id}` → LLM explanation

**User flow**: Browse problems → click "Explain" to read AI explanation → click
"Solve ↗" to open on LeetCode/CSES → return and mark as solved

---

#### 2. `/visualizer` — Algorithm Visualizer (NEW)

**Built with**: D3.js + Framer Motion (React components)

**Page layout**:

- Left: Algorithm selector (categorized: Sorting, Searching, Trees, Graphs, DP,
  etc.)
- Center: Visualization canvas (animated arrays, graphs, trees)
- Right: Step log with variable state
- Bottom: Playback controls (Play, Pause, Step Forward, Step Back, Speed slider)

**No backend API needed** — all visualization logic is frontend-only React
components.

**28 algorithms to build** (in priority order):

1. Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort
2. Binary Search, Linear Search
3. Two Pointers, Sliding Window
4. BFS (tree), DFS (tree), Inorder/Preorder/Postorder
5. BFS (graph), DFS (graph)
6. Stack push/pop, Queue enqueue/dequeue
7. Linked list reversal, cycle detection
8. Dijkstra, Topological Sort
9. DP Fibonacci (memoization vs tabulation), Knapsack, LCS

---

#### 3. `/patterns` — DSA Patterns Library (NEW)

**Data**: LLM-generated content stored in `curated_resources` or static MDX
files

**16 patterns to cover**: Two Pointers, Sliding Window, Fast & Slow Pointers,
Merge Intervals, Cyclic Sort, In-place Reversal, BFS, DFS, Two Heaps,
Subsets/Permutations, Modified Binary Search, Bitwise XOR, Top K Elements, K-way
Merge, 0/1 Knapsack, Topological Sort

**Each pattern page**: Explanation, when to use, template code (Python + Java),
5-10 example problems linked to `/practice`, visual diagram

---

#### 4. `/courses` — Course Catalog (NEW)

**Data**: `external_courses` table (seeded from FCC + TOP)

**Page layout**:

- Grid of course cards: title, source badge (FCC/TOP), lesson count, category,
  progress bar
- Click card → course detail: lesson list, descriptions, progress checkboxes
- "Start on FreeCodeCamp ↗" / "Start on Odin Project ↗" redirect buttons

**API calls**:

- `GET /api/courses?source=freecodecamp&category=web_dev`
- `PATCH /api/courses/progress/{course_id}` → update lessons completed

---

#### 5. `/projects` — Project Challenge Hub (NEW)

**Data**: Seeded from CodingChallenges.fyi + Coders Section

**Page layout**:

- Filterable grid: project cards with title, category, difficulty, tech stack
  tags
- Click → project detail: description, requirements, milestones, "Ask AI for
  hint" button
- Submit completed project: GitHub repo URL input → displayed on profile

---

#### 6. `/aptitude` — Aptitude Prep Engine (NEW)

**Data**: Pre-generated question bank in `aptitude_question_bank` table
(~500-1000 questions seeded by `seed_aptitude.py`). Results stored in
`aptitude_attempts`.

**Page layout**:

- Category selector: Quantitative, Logical, Verbal, Data Interpretation
- Optional company filter: TCS, Infosys, Wipro, Cognizant, etc.
- Difficulty selector: Easy / Medium / Hard
- Quiz interface: one question at a time, 4 MCQ options, submit → instant
  feedback + step-by-step explanation
- Results: score, accuracy by topic, improvement suggestions, topic-wise
  breakdown chart

**API calls**:

- `GET /api/aptitude/quiz?category=quantitative&topic=percentages&company=tcs&count=10`
  → returns 10 random questions from the bank
- `POST /api/aptitude/submit` → check answers against bank, store attempt,
  return explanations
- `GET /api/aptitude/analytics` → accuracy trends by category/topic over time

> **Zero LLM cost at runtime.** All questions are pre-generated and stored in
> the DB. The LLM is only called once during the `seed_aptitude.py` script. New
> questions can be added periodically by re-running the script.

---

#### 7. `/coach` — AI Coach Chat (EXISTS, needs build)

**Uses**: Agent 8 (Career Coach) — already exists in backend
(`agents/career_coach.py`, temperature 0.8)

**Page layout**:

- Chat interface (full-height, message bubbles)
- User types question → agent responds with personalized advice
- Agent proactively surfaces insights on first load: "Based on your latest sync,
  here are 3 things to focus on this week"
- Suggested prompts: "What should I study this week?", "Am I ready for Google?",
  "What's my biggest weakness?"

**Context passed per message**:

- User's latest platform scores (GitHub, LC, CC, HR)
- User's skill gaps per target company
- User's roadmap progress (current week, completion %)
- User's aptitude accuracy by category
- User's problem-solving stats (solved count, difficulty breakdown)
- Full merged analysis from last orchestrator run

**Chat history storage**: `JSONB` array in the existing `users.settings` column
(key: `coach_history`), capped at last 50 messages. No new table needed.

**API**:

- `POST /api/coach/message` → `{ message: string }` → returns AI response with
  context
- `GET /api/coach/history` → returns last 50 messages
- `DELETE /api/coach/history` → clear chat history

---

#### 8. `/resources` — Curated Resources Hub (NEW)

**Data**: `curated_resources` table

**Page layout**: Categorized link directory with search/filter

- DSA & Algorithms: Striver's, NeetCode, AlgoMaster links
- Web Development: FCC, TOP, Coders Section links
- Competitive Programming: LeetCode, CodeChef, HackerRank, CSES links
- Placement Prep: PrepInsta, IndiaBix, TopperWorld links
- System Design: CodingChallenges.fyi, RisingBrain links

---

#### 9. `/companies` — FIX: Wire to Backend (EXISTS, needs fix)

**Current problem**: Mock/static data, tabs show hardcoded content

**Fix**: Connect to `company_blueprints` table via existing `GET /api/companies`
endpoint. Wire tabs (Overview, DSA, Tech Stack, System Design, Interview,
Resources) to JSONB fields.

---

#### 10. `/roadmap` — Build Full Page (EXISTS as placeholder)

**Data**: `user_roadmaps` table (already populated by Agent 7)

**Page layout**: Week-by-week timeline with tasks, problem counts, milestones,
progress tracking

---

#### 11. `/match/[slug]` — Match Score Report (CORE PAGE)

**Data**: `company_match_scores` table + `user_skill_gaps` table

**This is the CORE user journey**: Dashboard score bar → click → `/match/google`
→ see full breakdown. Every company card, every score indicator, every roadmap
leads here. This is the page that answers "Why is my Google score 64%?"

**Page layout**:

- Hero: Overall match score (large circular gauge) + status label ("Preparing" /
  "Almost Ready" / "Ready")
- Breakdown: 7-component radar chart (DSA, Projects, Resume, Academic, Stack,
  System Design, Behavioral) with score per component
- Gaps: Prioritized list from `user_skill_gaps` — BLOCKING (red) / IMPORTANT
  (orange) / NICE_TO_HAVE (green)
- History: Line chart showing score trend over time (from `company_match_scores`
  time-series)
- Actions: "Generate Roadmap" button → links to `/roadmap/[slug]`, "Start
  Practice" → links to `/practice` filtered by company tags

**API calls**:

- `GET /api/scores/{company_slug}` → current match score + breakdown (EXISTS)
- `GET /api/scores/{company_slug}/history` → score trend data (NEW endpoint)
- `GET /api/skills/gaps?company={slug}` → skill gaps for this company (NEW
  endpoint)

---

#### 12. `/skills` — Skill Graph (D3.js Force Graph)

**Data**: HelixDB skill graph via `GET /api/skills/graph` new endpoint

**Page layout**:

- Full-screen force-directed graph (D3.js `d3-force`)
- **Nodes**: 200+ skills from HelixDB, sized by importance/centrality
- **Edges**: Dependency relationships (directed, weighted) — e.g., "Binary
  Search" → depends on "Arrays", "Sorting"
- **Colors**: Green = user has this skill, Red = user lacks this skill (gap),
  Gray = neutral
- **Click node**: Shows skill detail panel — description, current level,
  required level per company, learning resources
- **Zoom + Pan**: Standard D3 zoom behavior
- **Filter**: Toggle by category (DSA, Web Dev, System Design, Languages)

**API calls**:

- `GET /api/skills/graph` → returns nodes + edges from HelixDB (NEW endpoint)
- `GET /api/skills/{skill_name}` → skill detail + user's level (NEW endpoint)

---

#### 13. `/cheatsheets` — Quick Reference Cards (NEW)

**Data**: Static JSON/MDX files or `curated_resources` table (category =
'cheat_sheet')

**Page layout**:

- Grid of cheat sheet cards: HTML, CSS, JavaScript, React, Python, Java, Git,
  SQL, Data Structures, System Design
- Each card → full cheat sheet page with syntax, common patterns, examples
- Print-friendly / dark mode toggle

**Content source**: LLM-generated once via `scripts/generate_cheatsheets.py`,
stored as static JSON or in DB

---

## Frontend UI Workflow

> **All new frontend pages follow this process:**

```
Step 1: Agent provides detailed UX Pilot AI prompt for the page
Step 2: Karthik generates UI mockup using UX Pilot AI
Step 3: Karthik shares the screenshot(s) with the agent
Step 4: Agent builds the page matching the mockup exactly
Step 5: Agent suggests refinements if needed
Step 6: Iterate until approved
```

**For existing pages** being wired to backend (e.g., `/companies`): no new UI generation needed — just connect existing components to real API data.

**For new pages** (e.g., `/match/[slug]`, `/practice`, `/aptitude`): agent will provide a detailed prompt describing layout, components, colors, and data shapes before any frontend code is written.

---

## Part 6: Build Order — Sprint Plan (Revised)

> **Sprint reorder rationale**: The core product loop is Dashboard → Company
> Score → Match Report → Roadmap → Coach. This path must work end-to-end before
> we add learning features. "Nice-to-have" features (Visualizer, Patterns,
> Cheatsheets) move to later sprints.

### Sprint 1: Fix Companies + Match Report + Roadmap (1 week) — 🔶 IN PROGRESS

**Goal**: Complete the core user journey end-to-end

| Task                                                            | Type               | Files                                        | Status |
| --------------------------------------------------------------- | ------------------ | -------------------------------------------- | ------ |
| Wire `/companies` to backend `company_blueprints` data          | Frontend           | `companies/page.tsx`                         | 🔶 UI built, not wired |
| Wire `/company/[slug]` tabs to JSONB fields                     | Frontend           | `company/[slug]/page.tsx`                    | 🔶 UI built (1627 lines), mock data |
| **Build `/match/[slug]`** — the core match score breakdown page | Frontend + Backend | `match/[slug]/page.tsx`, `routers/scores.py` | 🔶 UI built (800 lines), mock data |
| Add `GET /api/scores/{slug}/history` endpoint                   | Backend            | `routers/scores.py`                          | ❌ |
| Add `GET /api/skills/gaps?company={slug}` endpoint              | Backend            | `routers/scores.py`                          | ❌ |
| Build `/roadmap` with `user_roadmaps` data                      | Frontend           | `roadmap/page.tsx`                           | 🔶 UI built (278 lines), mock data |
| Build `/roadmap/[slug]` for company-specific roadmap            | Frontend           | `roadmap/[slug]/page.tsx`                    | 🔶 UI built (786 lines), mock data |

> **Sprint 1 status**: All frontend pages are BUILT with full UI but use
> mock/static data. Backend wiring (API endpoints + data fetching) is the
> remaining work. The core user journey UI exists end-to-end.

---

### Sprint 2: Problem Database + DSA Practice (1.5 weeks) — ✅ COMPLETE

**Goal**: Import ~750-800 unique problems and build the practice page

| Task                                                             | Type     | Files                                                     | Status |
| ---------------------------------------------------------------- | -------- | --------------------------------------------------------- | ------ |
| DB tables: `external_problems` + `user_problem_progress`         | DB       | Raw SQL (tables created directly)                         | ✅     |
| All importers: CSES + NeetCode + Striver + Blind 75 combined     | Backend  | `scripts/seed_problems.py` (single unified script)        | ✅     |
| **Deduplication logic** (ON CONFLICT on title)                   | Backend  | `scripts/seed_problems.py`                                | ✅     |
| Problems router: list, filter, progress (6 endpoints)            | Backend  | `routers/practice.py` (209 lines)                         | ✅     |
| Problems repository                                              | Backend  | `repositories/problems.py` (177 lines)                    | ✅     |
| Build `/practice` page (filters, pagination, status toggle)      | Frontend | `practice/page.tsx` (470 lines)                           | ✅     |
| Build `/practice/[id]` (detail, mark solved, back link)          | Frontend | `practice/[id]/page.tsx` (244 lines)                      | ✅     |
| React Query hooks (6 hooks)                                      | Frontend | `lib/api.ts`                                              | ✅     |
| DB seeded: **1134 unique problems** (exceeded 800 target)        | Data     | 5 sources deduped via SQLAlchemy ORM                      | ✅     |
| `/dsa` → `/practice` redirect + sidebar updated                  | Frontend | `dsa/page.tsx`, `Sidebar.tsx`                             | ✅     |

> **Actual seeded count**: 1134 unique problems (more than 800 target due to
> better deduplication logic). Sources: NeetCode 150, NeetCode All, Blind 75,
> Striver A2Z, CSES.
>
> **Remaining practice page gaps** (to be addressed in Sprint 2.5 or later):
> - Problem descriptions/hints are all NULL (need enrichment script)
> - Company tags not populated (need cross-reference with `company_wise_problems.json`)
> - Pattern filter exists in backend params but not surfaced in frontend
> - No solved status filter, no sorting by column
> - `services/problem_service.py` not created (logic lives in repository)
> - `POST /api/practice/explain/{id}` not built (needs Agent 9 + LiteLLM/Groq)
> - Multi-language solution code tabs not implemented
> - Streak/stagnation analytics not computed

---

### Sprint 3: AI Coach + Roadmap Wiring (1 week)

**Goal**: Complete the advisory core — roadmap + coach are central to placement
outcomes

| Task                                                            | Type     | Files              |
| --------------------------------------------------------------- | -------- | ------------------ |
| Coach router: chat endpoint using Agent 8                       | Backend  | `routers/coach.py` |
| Coach history storage in `users.settings` JSONB                 | Backend  | `routers/coach.py` |
| `POST /api/coach/message` with full context injection           | Backend  | `routers/coach.py` |
| `GET /api/coach/history` + `DELETE /api/coach/history`          | Backend  | `routers/coach.py` |
| Build `/coach` chat page with suggested prompts                 | Frontend | `coach/page.tsx`   |
| Proactive insight on first load ("Here's your focus this week") | Frontend | `coach/page.tsx`   |

---

### Sprint 4: Aptitude Engine (1 week)

**Goal**: Pre-generate question bank + build quiz UI

| Task                                                              | Type     | Files                          |
| ----------------------------------------------------------------- | -------- | ------------------------------ |
| Alembic migration: `aptitude_question_bank` + `aptitude_attempts` | DB       | `migrations/`                  |
| Seed script: LLM-generate 500-1000 questions ONCE                 | Backend  | `scripts/seed_aptitude.py`     |
| Aptitude service (serve from bank + scoring)                      | Backend  | `services/aptitude_service.py` |
| Aptitude router (`GET /quiz`, `POST /submit`, `GET /analytics`)   | Backend  | `routers/aptitude.py`          |
| Build `/aptitude` quiz interface                                  | Frontend | `aptitude/page.tsx`            |
| Company prep: extend `/company/[slug]` with aptitude prep tab     | Frontend | `company/[slug]/page.tsx`      |

---

### Sprint 5: Courses + Resource Hub (1 week)

**Goal**: Import FCC/TOP + build resource hub

| Task                                                                                                | Type     | Files                       |
| --------------------------------------------------------------------------------------------------- | -------- | --------------------------- |
| Alembic migration: `external_courses` + `user_course_progress` (with `completed_lesson_ids TEXT[]`) | DB       | `migrations/`               |
| FCC curriculum importer (GitHub JSON parser)                                                        | Backend  | `scrapers/fcc_importer.py`  |
| TOP curriculum importer (GitHub markdown parser)                                                    | Backend  | `scrapers/odin_importer.py` |
| Courses router + repository + service                                                               | Backend  | `routers/courses.py`        |
| Build `/courses` page with course grid                                                              | Frontend | `courses/page.tsx`          |
| Build `/courses/[id]` with lesson list + redirect buttons                                           | Frontend | `courses/[id]/page.tsx`     |
| Alembic migration: `curated_resources`                                                              | DB       | `migrations/`               |
| Seed curated resource links (all 16 platforms)                                                      | Backend  | `scripts/seed_resources.py` |
| Build `/resources` page                                                                             | Frontend | `resources/page.tsx`        |

---

### Sprint 6: Skills Graph + Trends + Simulator (1.5 weeks)

**Goal**: Build the analytics and insight pages

| Task                                                      | Type     | Files                     |
| --------------------------------------------------------- | -------- | ------------------------- |
| `GET /api/skills/graph` endpoint (query HelixDB)          | Backend  | `routers/skills.py` (NEW) |
| `GET /api/skills/{name}` endpoint                         | Backend  | `routers/skills.py`       |
| Build `/skills` — D3.js force graph with click-to-inspect | Frontend | `skills/page.tsx`         |
| Implement `trends.py` router (Agent 4 data)               | Backend  | `routers/trends.py`       |
| Build `/trends` — market trend charts with Recharts       | Frontend | `trends/page.tsx`         |
| Build `/simulate` — career simulator                      | Frontend | `simulate/page.tsx`       |

**`/simulate` spec**: "What-if" career simulator. User adjusts sliders: "If I
solve 50 more LeetCode mediums", "If I learn React", "If I do 2 projects" →
recalculates match scores in real-time for their target companies. Shows
before/after comparison. Backend: `POST /api/simulate` takes hypothetical
deltas, runs scoring engine with modified inputs, returns projected scores. No
DB needed — purely computational.

---

### Sprint 7: Visualizer + Patterns (2 weeks) — Nice-to-Have

**Goal**: Algorithm animations and DSA patterns reference

| Task                                                               | Type     | Files                                |
| ------------------------------------------------------------------ | -------- | ------------------------------------ |
| Visualizer page layout + algorithm selector                        | Frontend | `visualizer/page.tsx`                |
| Array visualizer component (D3.js bars)                            | Frontend | `components/visualizer/ArrayViz.tsx` |
| Sorting animations (Bubble, Merge, Quick) — **start with 10 core** | Frontend | `components/visualizer/sorts/`       |
| Search animations (Binary, Linear)                                 | Frontend | `components/visualizer/search/`      |
| Two Pointers + Sliding Window animation                            | Frontend | `components/visualizer/patterns/`    |
| Tree traversal animations (BFS, DFS)                               | Frontend | `components/visualizer/trees/`       |
| Playback controls + variable state panel                           | Frontend | `components/visualizer/Controls.tsx` |
| Create DSA pattern content (LLM-generated JSON)                    | Backend  | `scripts/generate_patterns.py`       |
| Build `/patterns` page + 16 pattern subpages                       | Frontend | `patterns/page.tsx`                  |

---

### Sprint 8: Projects + Cheatsheets + Polish (1.5 weeks)

**Goal**: Final content pages + sidebar update + polish everything

| Task                                                          | Type     | Files                                                            |
| ------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| Seed project challenges (from CodingChallenges.fyi)           | Backend  | `scripts/seed_projects.py`                                       |
| Build `/projects` page                                        | Frontend | `projects/page.tsx`                                              |
| Generate cheat sheet content (LLM, store as JSON/MDX)         | Backend  | `scripts/generate_cheatsheets.py`                                |
| Build `/cheatsheets` page + 10 cheat sheet subpages           | Frontend | `cheatsheets/page.tsx`                                           |
| **Update Sidebar** with new nav sections (Learn, Prepare)     | Frontend | `components/ui/Sidebar.tsx`                                      |
| AI Explanations: Agent 9 + explanation service                | Backend  | `agents/explanation_agent.py`, `services/explanation_service.py` |
| `POST /api/practice/explain/{id}` endpoint                    | Backend  | `routers/practice.py`                                            |
| "Explain" button + explanation panel on practice pages        | Frontend | `practice/page.tsx`, `practice/[id]/page.tsx`                    |
| Polish all pages: loading skeletons, error states, responsive | Frontend | All pages                                                        |

---

### Sprint 9: Deployment + Production (1 week)

**Goal**: Ship it

| Task                                       | Type      | Files                |
| ------------------------------------------ | --------- | -------------------- |
| Environment variables for all new services | DevOps    | `.env.example`       |
| Update Docker Compose (add seed scripts)   | DevOps    | `docker-compose.yml` |
| Vercel deployment (frontend)               | DevOps    | `vercel.json`        |
| Railway deployment (backend)               | DevOps    | `railway.toml`       |
| GitHub Actions CI/CD update                | DevOps    | `.github/workflows/` |
| Demo video recording                       | Portfolio | —                    |
| README.md update with all features         | Docs      | `README.md`          |

---

## Part 7: Final Feature Summary (Revised)

### What MintKey Becomes — Ordered by Sprint

| Feature                                    | Sprint      | Source                                              | Status |
| ------------------------------------------ | ----------- | --------------------------------------------------- | ------ |
| 📊 **Dashboard**                           | ✅ Done     | GitHub + LC + CC + HR sync                          | ✅ Wired |
| 🏢 **Company Explorer**                    | 🔧 Sprint 1 | 15 company blueprints                               | 🔶 UI built, mock data |
| 🎯 **Match Score Report**                  | 🔧 Sprint 1 | Score breakdown + gap analysis                      | 🔶 UI built, mock data |
| 🗺️ **Personalized Roadmaps**               | 🔧 Sprint 1 | Agent 7 output                                      | 🔶 UI built, mock data |
| 📝 **DSA Practice** (~1134 unique problems) | 🔨 Sprint 2 | CSES + NeetCode + Striver's (deduplicated)          | ✅ Built + Seeded |
| 💬 **AI Coach**                            | 🔨 Sprint 3 | Agent 8 with full user context (LiteLLM/Groq)       | 🔲 Placeholder |
| 📝 **Aptitude Engine**                     | 🔨 Sprint 4 | Pre-generated question bank (zero runtime LLM cost) | 🔲 Not started |
| 📚 **Course Catalog**                      | 🔨 Sprint 5 | FreeCodeCamp + Odin Project                         | 🔲 Not started |
| 📖 **Resource Hub**                        | 🔨 Sprint 5 | All 16 platforms                                    | 🔲 Not started |
| 🕸️ **Skill Graph**                         | 🔨 Sprint 6 | HelixDB + D3.js force graph                         | 🔲 Placeholder |
| 📈 **Market Trends**                       | 🔨 Sprint 6 | Agent 4 (via LiteLLM/Groq)                          | 🔲 Placeholder |
| 🎯 **Career Simulator**                    | 🔨 Sprint 6 | Custom                                              | 🔲 Placeholder |
| 🎬 **Algorithm Visualizer**                | 🔨 Sprint 7 | Custom D3.js (10 core first)                        | 🔲 Not started |
| 🧩 **DSA Patterns**                        | 🔨 Sprint 7 | RisingBrain + LLM (Groq)                            | 🔲 Not started |
| 🚀 **Project Challenges**                  | 🔨 Sprint 8 | CodingChallenges.fyi + Coders Section               | 🔲 Not started |
| 📋 **Cheat Sheets**                        | 🔨 Sprint 8 | Coders Section + LLM-generated (Groq)               | 🔲 Not started |
| 🤖 **AI Explanations**                     | 🔨 Sprint 8 | Agent 9 via LiteLLM/Groq                            | 🔲 Not started |
| 👤 **Profile**                             | ✅ Done     | —                                                   | ✅ Wired |
| ⚙️ **Settings**                            | ✅ Done     | —                                                   | ✅ Wired |
| 🔐 **Auth + Onboarding**                   | ✅ Done     | GitHub OAuth                                        | ✅ Wired |

### Redirect Destinations

| Action                 | Platform     | Link Format                           |
| ---------------------- | ------------ | ------------------------------------- |
| Solve DSA problem      | LeetCode     | `leetcode.com/problems/{slug}`        |
| Solve on CodeChef      | CodeChef     | `codechef.com/problems/{code}`        |
| Practice on HackerRank | HackerRank   | `hackerrank.com/domains/{domain}`     |
| Take FCC Course        | FreeCodeCamp | `freecodecamp.org/learn/{superblock}` |
| Take TOP Lesson        | Odin Project | `theodinproject.com/lessons/{slug}`   |
| Premium Course         | Scaler       | `scaler.com/topics/{topic}`           |

### Total Scope (Corrected)

- **9 new database tables** (7 migrations, includes `aptitude_question_bank`)
- **6 new importers/scrapers**
- **6 new routers** + 2 existing routers enhanced (no phantom `visualizer.py`)
- **4 new services** (no `visualizer_service.py` — frontend-only)
- **4 new repositories**
- **1 new LLM agent** (explanation agent)
- **13 new frontend pages** (including `/match`, `/skills`, `/cheatsheets`)
- **10-15 algorithm visualization components** (starting with 10 core, expand
  later)
- **~750-800 unique problems seeded** (deduplicated across all lists)
- **500-1000 aptitude questions pre-generated** (stored in DB, zero runtime
  cost)
- **~200+ course entries seeded**
- **~100+ curated resource links**
- **16 DSA pattern pages**
- **10 cheat sheet pages**
- **9 sprints over ~12 weeks**

---

## Appendix: Review Fixes Applied (v2)

| # | Issue                                                 | Fix                                                    |
| - | ----------------------------------------------------- | ------------------------------------------------------ |
| 1 | `/match/[slug]` buried in Sprint 8                    | ✅ Moved to **Sprint 1** — core user journey           |
| 2 | Visualizer in Sprint 4 blocking core features         | ✅ Moved to **Sprint 7** — nice-to-have                |
| 3 | `user_course_progress` missing lesson IDs             | ✅ Added `completed_lesson_ids TEXT[]`                 |
| 4 | Aptitude LLM cost ($15-30/day)                        | ✅ Pre-generate 500-1000 questions ONCE, serve from DB |
| 5 | `visualizer.py` router contradicts frontend-only spec | ✅ Removed from routers + services list                |
| 6 | `/cheatsheets` missing from sprint plan               | ✅ Added to **Sprint 8**                               |
| 7 | Problem count claim "1000+" not accounting for dedup  | ✅ Corrected to **~750-800 unique** with dedup note    |

### v3 Fixes (from 9.6 → 10)

| #  | Issue                                                               | Fix                                                                                      |
| -- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 8  | `user_problem_progress` missing `time_spent_sec` + `attempts_count` | ✅ Added both fields — enables difficulty calibration + Agent 9 context                  |
| 9  | Sidebar nav mismatch between Part 2 and Part 5                      | ✅ Unified — Skill Graph in PREPARE, consistent in both specs                            |
| 10 | `generate_explanations.py` no scope limit                           | ✅ Scoped to **top 200 problems** (NeetCode 150 + CSES top 50), rest is on-demand cached |
| 11 | `/dsa` dead route not addressed                                     | ✅ Added one-line redirect `/dsa` → `/practice`                                          |
| 12 | `/simulate` never specced                                           | ✅ Added what-if simulator spec (slider-based, purely computational, no new DB)          |

# MintKey — Build Progress Tracker

> Last updated: 2026-03-04 13:52 IST

---

## Phase 1: Foundation & Infrastructure ✅

| Task                                                         | Status  | Date  |
| ------------------------------------------------------------ | ------- | ----- |
| FastAPI backend skeleton (7 routers, 3 middleware, main app) | ✅ Done | Mar 3 |
| SQLAlchemy ORM — 8 tables                                    | ✅ Done | Mar 3 |
| Alembic migration — all tables verified                      | ✅ Done | Mar 3 |
| LiteLLM client (Groq primary + Ollama fallback)              | ✅ Done | Mar 3 |
| Pydantic v2 schemas + Repository pattern                     | ✅ Done | Mar 3 |
| Next.js 14 + Tailwind design system + Zustand + React Query  | ✅ Done | Mar 3 |
| Docker Compose + CI/CD + `.env.example`                      | ✅ Done | Mar 3 |
| GitHub OAuth via NextAuth.js v5                              | ✅ Done | Mar 3 |

---

## Phase 2: Data Integration & Platform Sync ✅

| Task                                                        | Status  | Date  |
| ----------------------------------------------------------- | ------- | ----- |
| GitHub REST API scraper (httpx + Redis cache)               | ✅ Done | Mar 4 |
| LeetCode GraphQL scraper                                    | ✅ Done | Mar 4 |
| Resume PDF parser + Skill taxonomy (150+) + Skill extractor | ✅ Done | Mar 4 |
| Celery + Upstash Redis task queue + Sync API routes         | ✅ Done | Mar 4 |

---

## Phase 3: 8-Agent LLM Engine ✅

| Task                                                                   | Status  | Date  |
| ---------------------------------------------------------------------- | ------- | ----- |
| Agentic loop core + Tool executor (9 tools)                            | ✅ Done | Mar 4 |
| Agents 1-8 (GitHub, DSA, Resume, Trends, Company, Gap, Roadmap, Coach) | ✅ Done | Mar 4 |
| Orchestrator (parallel Phase 1 + sequential Phase 2)                   | ✅ Done | Mar 4 |
| Analysis route + WebSocket progress + Redis status                     | ✅ Done | Mar 4 |

---

## Phase 4: Scoring Engine & Company Blueprints ✅

| Task                                                                    | Status  | Date  |
| ----------------------------------------------------------------------- | ------- | ----- |
| Weighted scoring algorithm (15+ companies, 7 components)                | ✅ Done | Mar 4 |
| Company blueprint seeding (15 companies with hiring/DSA/interview data) | ✅ Done | Mar 4 |
| HelixDB skill graph (200+ nodes, dependency edges, BFS traversal)       | ✅ Done | Mar 4 |
| Gap analysis + skill graph service + topological sort                   | ✅ Done | Mar 4 |
| Match score computation + POST /compute endpoint + time-series          | ✅ Done | Mar 4 |

---

## Phase 5: Frontend — All 15 Pages 🔲

| Task                               | Status         | Date |
| ---------------------------------- | -------------- | ---- |
| Landing page (/)                   | 🔲 Not started | —    |
| Auth page (/auth)                  | 🔲 Not started | —    |
| Onboarding wizard (/onboarding)    | 🔲 Not started | —    |
| Main dashboard (/dashboard)        | 🔲 Not started | —    |
| Profile & integrations (/profile)  | 🔲 Not started | —    |
| Company explorer (/companies)      | 🔲 Not started | —    |
| Company detail (/company/[slug])   | 🔲 Not started | —    |
| Match score report (/match/[slug]) | 🔲 Not started | —    |
| Roadmap page (/roadmap/[slug])     | 🔲 Not started | —    |
| Skill graph (/skills) — D3.js      | 🔲 Not started | —    |
| DSA tracker (/dsa)                 | 🔲 Not started | —    |
| Market trends (/trends)            | 🔲 Not started | —    |
| Career simulator (/simulate)       | 🔲 Not started | —    |
| AI Coach chat (/coach)             | 🔲 Not started | —    |
| Settings (/settings)               | 🔲 Not started | —    |

---

## Phase 6: Polish, Deploy & Portfolio 🔲

| Task                                     | Status         | Date |
| ---------------------------------------- | -------------- | ---- |
| Monitoring + Billing + Load testing      | 🔲 Not started | —    |
| Vercel + Railway deployment + Demo video | 🔲 Not started | —    |

---

## Git Commits

| Hash      | Message                                                       | Date  |
| --------- | ------------------------------------------------------------- | ----- |
| `2e807fa` | feat(backend): Phase 1 foundation                             | Mar 3 |
| `79fe937` | feat(frontend): Next.js 14 + design system                    | Mar 3 |
| `698948a` | feat(auth): GitHub OAuth via NextAuth.js v5                   | Mar 3 |
| `abb92a3` | feat(phase2): Scrapers, NLP, Celery, sync routes              | Mar 4 |
| `01bef5d` | feat(agents): Phase 3 — 8-agent LLM engine + orchestrator     | Mar 4 |
| `7b448b6` | feat(phase4): Scoring engine, company blueprints, skill graph | Mar 4 |

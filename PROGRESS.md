# MintKey — Build Progress Tracker

> Last updated: 2026-03-04 13:40 IST

---

## Phase 1: Foundation & Infrastructure ✅

| Task                                                                         | Status  | Date  |
| ---------------------------------------------------------------------------- | ------- | ----- |
| FastAPI backend skeleton (7 routers, 3 middleware, main app)                 | ✅ Done | Mar 3 |
| SQLAlchemy ORM — 8 tables (users, company_blueprints, platform_scores, etc.) | ✅ Done | Mar 3 |
| Alembic migration — all tables created & verified in Postgres                | ✅ Done | Mar 3 |
| LiteLLM client (Groq primary + Ollama fallback)                              | ✅ Done | Mar 3 |
| Pydantic v2 schemas + Repository pattern                                     | ✅ Done | Mar 3 |
| Next.js 14 project (App Router, TypeScript, Tailwind v4)                     | ✅ Done | Mar 3 |
| Tailwind design system (dark navy + indigo accent)                           | ✅ Done | Mar 3 |
| Zustand stores + React Query + Axios client                                  | ✅ Done | Mar 3 |
| Docker Compose (API, Postgres, Redis, HelixDB)                               | ✅ Done | Mar 3 |
| CI/CD workflows (lint + deploy)                                              | ✅ Done | Mar 3 |
| `.env.example` + real API keys configured                                    | ✅ Done | Mar 3 |
| GitHub OAuth via NextAuth.js v5 + login page + middleware                    | ✅ Done | Mar 3 |

---

## Phase 2: Data Integration & Platform Sync ✅

| Task                                                                     | Status  | Date  |
| ------------------------------------------------------------------------ | ------- | ----- |
| GitHub REST API scraper (httpx async + Redis 24hr cache)                 | ✅ Done | Mar 4 |
| LeetCode GraphQL scraper (profile, stats, topics, contests)              | ✅ Done | Mar 4 |
| Resume PDF parser (PyMuPDF + section extraction)                         | ✅ Done | Mar 4 |
| Skill taxonomy (150+ skills, 10 categories, aliases)                     | ✅ Done | Mar 4 |
| Skill extractor (text matching + language mapping + demand index)        | ✅ Done | Mar 4 |
| Celery + Upstash Redis task queue (sync + scoring tasks)                 | ✅ Done | Mar 4 |
| Sync API routes (trigger, github/direct, leetcode/direct, resume/upload) | ✅ Done | Mar 4 |

---

## Phase 3: 8-Agent LLM Engine ✅

| Task                                                              | Status  | Date  |
| ----------------------------------------------------------------- | ------- | ----- |
| Agentic loop core (reason → tool_calls → observe → repeat, max 3) | ✅ Done | Mar 4 |
| Tool executor (9 tools, OpenAI-format definitions)                | ✅ Done | Mar 4 |
| Agent I/O models (Pydantic, all 8 agents typed)                   | ✅ Done | Mar 4 |
| Agent 1: GitHub Intelligence Analyst (tools, temp 0.2)            | ✅ Done | Mar 4 |
| Agent 2: DSA Performance Analyst (no tools, temp 0.1)             | ✅ Done | Mar 4 |
| Agent 3: Resume Intelligence Parser (no tools, temp 0.0)          | ✅ Done | Mar 4 |
| Agent 4: Market Trend Watcher (no tools, temp 0.3)                | ✅ Done | Mar 4 |
| Agent 5: Company Blueprint Expert (tools, temp 0.1)               | ✅ Done | Mar 4 |
| Agent 6: Skill Gap Analyzer (HelixDB tools, temp 0.2)             | ✅ Done | Mar 4 |
| Agent 7: Roadmap Generator (resource tools, temp 0.7)             | ✅ Done | Mar 4 |
| Agent 8: AI Career Coach (synthesis, temp 0.8)                    | ✅ Done | Mar 4 |
| Orchestrator (Phase 1 parallel + Phase 2 sequential)              | ✅ Done | Mar 4 |
| Analysis route + WebSocket progress + Redis status                | ✅ Done | Mar 4 |

---

## Phase 4: Scoring Engine & Company Blueprints 🔲

| Task                                      | Status         | Date |
| ----------------------------------------- | -------------- | ---- |
| Weighted scoring algorithm                | 🔲 Not started | —    |
| Company blueprint seeding (15+ companies) | 🔲 Not started | —    |
| HelixDB skill graph seeding (200+ nodes)  | 🔲 Not started | —    |
| Gap analysis algorithm                    | 🔲 Not started | —    |
| Match score computation + time-series     | 🔲 Not started | —    |
| NLP skill extraction pipeline             | 🔲 Not started | —    |

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

| Task                              | Status         | Date |
| --------------------------------- | -------------- | ---- |
| Monitoring (BetterStack + Sentry) | 🔲 Not started | —    |
| BillingSDK (Free vs Pro)          | 🔲 Not started | —    |
| Load testing (Locust)             | 🔲 Not started | —    |
| Landing page polish               | 🔲 Not started | —    |
| Vercel + Railway deployment       | 🔲 Not started | —    |
| Demo video recording              | 🔲 Not started | —    |

---

## Git Commits

| Hash      | Message                                                                                | Date  |
| --------- | -------------------------------------------------------------------------------------- | ----- |
| `2e807fa` | feat(backend): Phase 1 foundation — FastAPI skeleton, SQLAlchemy ORM, Alembic, LiteLLM | Mar 3 |
| `79fe937` | feat(frontend): Next.js 14 with Tailwind design system, Zustand, React Query + Axios   | Mar 3 |
| `5c9f4b1` | fix(lint): remove 3 unused imports + add PROGRESS.md tracker                           | Mar 3 |
| `698948a` | feat(auth): GitHub OAuth via NextAuth.js v5 + backend auth endpoint + login page       | Mar 3 |
| `abb92a3` | feat(phase2): GitHub + LeetCode scrapers, resume parser, skill taxonomy, Celery tasks  | Mar 4 |
| `2bf70b7` | chore(tracker): clean up PROGRESS.md + Phase 2 complete                                | Mar 4 |
| `01bef5d` | feat(agents): Phase 3 — 8-agent LLM engine, orchestrator, analysis route + WebSocket   | Mar 4 |

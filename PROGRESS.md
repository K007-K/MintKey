# MintKey — Build Progress Tracker

> Last updated: 2026-03-03 23:37 IST

---

## Phase 1: Foundation & Infrastructure ✅

| Task                                                                                                                                                                                  | Status  | Date  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| FastAPI backend skeleton (5 routers, 3 middleware, main app)                                                                                                                          | ✅ Done | Mar 3 |
| SQLAlchemy ORM — 8 tables (`users`, `company_blueprints`, `platform_scores`, `company_match_scores`, `user_target_companies`, `user_skill_gaps`, `user_roadmaps`, `analysis_results`) | ✅ Done | Mar 3 |
| Alembic migration — all tables created & verified in Postgres                                                                                                                         | ✅ Done | Mar 3 |
| LiteLLM client (Groq primary + Ollama fallback)                                                                                                                                       | ✅ Done | Mar 3 |
| Pydantic v2 schemas (API response envelope, User, Auth, Analysis, Company)                                                                                                            | ✅ Done | Mar 3 |
| Repository pattern (users, scores)                                                                                                                                                    | ✅ Done | Mar 3 |
| Next.js 14 project (App Router, TypeScript, Tailwind v4)                                                                                                                              | ✅ Done | Mar 3 |
| Task                                                                                                                                                                                  | Status  | Date  |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------ | :---- |
| FastAPI backend skeleton (5 routers, 3 middleware, main app)                                                                                                                          | ✅ Done | Mar 3 |
| SQLAlchemy ORM — 8 tables (`users`, `company_blueprints`, `platform_scores`, `company_match_scores`, `user_target_companies`, `user_skill_gaps`, `user_roadmaps`, `analysis_results`) | ✅ Done | Mar 3 |
| Alembic migration — all tables created & verified in Postgres                                                                                                                         | ✅ Done | Mar 3 |
| LiteLLM client (Groq primary + Ollama fallback)                                                                                                                                       | ✅ Done | Mar 3 |
| Pydantic v2 schemas (API response envelope, User, Auth, Analysis, Company)                                                                                                            | ✅ Done | Mar 3 |
| Repository pattern (users, scores)                                                                                                                                                    | ✅ Done | Mar 3 |
| Next.js 14 project (App Router, TypeScript, Tailwind v4)                                                                                                                              | ✅ Done | Mar 3 |
| Tailwind design system (dark navy + indigo accent)                                                                                                                                    | ✅ Done | Mar 3 |
| Zustand stores (sidebar, company, preferences)                                                                                                                                        | ✅ Done | Mar 3 |
| React Query + Axios client with JWT interceptor                                                                                                                                       | ✅ Done | Mar 3 |
| Docker Compose (API, Postgres, Redis, HelixDB)                                                                                                                                        | ✅ Done | Mar 3 |
| CI/CD workflows (lint + deploy)                                                                                                                                                       | ✅ Done | Mar 3 |
| `.env.example` + real keys configured                                                                                                                                                 | ✅ Done | Mar 3 |
| GitHub OAuth via NextAuth.js v5                                                                                                                                                       | ✅ Done | Mar 3 |

---

## Phase 2: Data Integration & Platform Sync 🔲

| Task                                          | Status         | Date |
| :-------------------------------------------- | :------------- | :--- |
| GitHub REST API scraper (httpx async)         | 🔲 Not started | —    |
| LeetCode GraphQL scraper                      | 🔲 Not started | —    |
| Resume PDF parser (PyMuPDF + spaCy)           | 🔲 Not started | —    |
| Celery + Upstash Redis task queue             | 🔲 Not started | —    |
| Redis caching layer (24hr GitHub, 1hr scores) | 🔲 Not started | —    |
| Onboarding data collection                    | 🔲 Not started | —    |

---

## Phase 3: 8-Agent LLM Engine 🔲

| Task                                     | Status         | Date |
| :--------------------------------------- | :------------- | :--- |
| Agentic loop core (tool calling pattern) | 🔲 Not started | —    |
| Agent 1: GitHub Intelligence Analyst     | 🔲 Not started | —    |
| Agent 2: DSA Performance Analyst         | 🔲 Not started | —    |
| Agent 3: Resume Intelligence Parser      | 🔲 Not started | —    |
| Agent 4: Market Trend Watcher            | 🔲 Not started | —    |
| Agent 5: Company Blueprint Expert        | 🔲 Not started | —    |
| Agent 6: Skill Gap Analyzer (HelixDB)    | 🔲 Not started | —    |
| Agent 7: Roadmap Generator               | 🔲 Not started | —    |
| Agent 8: AI Career Coach                 | 🔲 Not started | —    |
| Orchestrator (parallel + sequential)     | 🔲 Not started | —    |
| Tool executor layer                      | 🔲 Not started | —    |
| Analysis route + WebSocket progress      | 🔲 Not started | —    |

---

## Phase 4: Scoring Engine & Company Blueprints 🔲

| Task                                      | Status         | Date |
| :---------------------------------------- | :------------- | :--- |
| Weighted scoring algorithm                | 🔲 Not started | —    |
| Company blueprint seeding (15+ companies) | 🔲 Not started | —    |
| HelixDB skill graph seeding (200+ nodes)  | 🔲 Not started | —    |
| Gap analysis algorithm                    | 🔲 Not started | —    |
| Match score computation + time-series     | 🔲 Not started | —    |
| NLP skill extraction pipeline             | 🔲 Not started | —    |

---

## Phase 5: Frontend — All 15 Pages 🔲

| Task                               | Status         | Date |
| :--------------------------------- | :------------- | :--- |
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

| Hash      | Message                                                                                                           | Date  |
| --------- | ----------------------------------------------------------------------------------------------------------------- | ----- |
| `2e807fa` | feat(backend): Phase 1 foundation — FastAPI skeleton, SQLAlchemy ORM, Alembic, LiteLLM, middleware, Docker, CI/CD | Mar 3 |
| `79fe937` | feat(frontend): Next.js 14 project with Tailwind design system, Zustand stores, React Query + Axios               | Mar 3 |

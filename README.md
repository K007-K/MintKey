# MintKey — AI Career Targeting Platform (DevPath AI)

MintKey is an AI-powered career targeting platform that analyzes a student's GitHub, LeetCode, and Resume to generate highly personalized, company-specific preparation roadmaps.

The platform utilizes a multi-agent architecture powered entirely by open-source LLMs to evaluate candidate profiles against real-world company blueprints. It highlights skill gaps, dynamically generates customized study itineraries, and offers AI career coaching.

---

## 🏗️ Technology Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand (Client) + React Query (Server/API State)
- **Visualizations:** Recharts (standard charts) + D3.js (Skill Graph force-directed visualization)
- **UI Components:** shadcn/ui, tailark templates
- **Auth:** NextAuth.js v5 with Supabase adapter

### Backend
- **Framework:** FastAPI (Python 3.11+) (Fully Async)
- **Database (Primary):** PostgreSQL via Supabase (SQLAlchemy 2.0 ORM + Alembic)
- **Database (Skill Graph):** HelixDB (Rust-built graph + vector database)
- **Cache & Task Queue:** Upstash Redis + Celery
- **Background Jobs:** Celery background tasks for platform syncs and metrics recomputations.
- **Data Validation:** Pydantic v2
- **Scraping:** httpx.AsyncClient (GitHub/LeetCode), Scrapy (jobs), PyMuPDF+spaCy (Resume parsing)

### AI & Agents
- **Adapter:** LiteLLM (Exclusively Open-Source Models)
- **Default Models:** `groq/llama-3.3-70b-versatile` (fast/primary) & `ollama/qwen2.5-coder:32b` (local/fallback)
- **Agent Architecture:** 8 specialized agents running an Agentic Loop pattern (Reason → Tool Call → Observe → Repeat)

---

## 🚀 Progress & What We've Built So Far

We have accomplished major milestones across the backend infrastructure, AI agent pipeline, and the user-facing web dashboard. Here is a breakdown of what has been implemented to date:

### 1. Foundation & Infrastructure (Completed)
- **FastAPI Backend:** Fully asynchronous backend skeleton with routers, middleware, and logging.
- **Database ORM:** SQLAlchemy implemented with 8 core tables and Alembic migrations configured.
- **LiteLLM integration:** Client configured for seamless switching between Groq and local Ollama models.
- **Next.js & Design System:** Frontend initialized with Next.js App Router, Tailwind CSS, Zustand, and strict TypeScript types.
- **Authentication:** GitHub OAuth successfully wired up using NextAuth.js v5.

### 2. Data Integration & Platform Sync (Completed)
- **GitHub Scraper:** Extracts public repos, languages, and commit activities using httpx and Redis cache.
- **LeetCode Scraper:** GraphQL-based extraction of problem-solving statistics and topic distributions.
- **Resume NLP Parser:** PyMuPDF & SPAcy pipeline implemented alongside a 150+ skill taxonomy for entity extraction.
- **Background Workers:** Celery combined with Upstash Redis to handle async data synchronization.

### 3. The 8-Agent LLM Engine (Completed)
- Built a custom **Agentic Loop core** and centralized **Tool Executor** (with 9 available database/scraping tools).
- Configured and wired **all 8 LLM Agents**:
  1. *GitHub Intelligence Analyst*
  2. *DSA Performance Analyst*
  3. *Resume Intelligence Parser*
  4. *Market Trend Intelligence*
  5. *Company Blueprint Expert*
  6. *Skill Gap Analyzer* (Integrated with HelixDB for graph traversal)
  7. *Roadmap Generator*
  8. *AI Career Coach*
- Implemented the **Orchestrator** to run Agents 1-5 in parallel, and feed their outputs sequentially into Agents 6, 7, and 8.

### 4. Scoring Engine & Company Blueprints (Completed)
- Developed a weighted scoring algorithm covering 15+ mock companies and 7 different evaluation components.
- Seeded the database with 15 detailed company hiring blueprints (DSA thresholds, interviews, required tech stacks).
- Populated the **HelixDB Skill Graph** with 200+ nodes and dependency edges, enabling topological sort analysis for learning paths.
- APIs exposed for computing and receiving Match Scores dynamically based on new user data.

### 5. Frontend & UI Pages (In Progress / Completed Modules)
We've focused significantly on turning the data into a beautiful, functional UI:
- **Dashboard (`/dashboard`):** Fully enriched with personalized data including GitHub/LeetCode readiness scores, AI-generated action items, recent activities, gap analysis, and Recharts profile radar/breakdown charts.
- **Settings Page (`/settings`):** Configured interactive states for Export PDF, Download JSON, Clear Cache, Delete Account (with confirmation dialog), and toggle handlers for Dark/Light mode and compact views.
- **Company Explorer (`/companies`):** Refined and polished into a modern SaaS standard. Added clear spacing, color-coding, card interactivity, hover effects, and a highly scannable grid layout.
- **Theming Fixes:** Stabilized the Tailwind configuration to correctly respect Light mode requests based on user preferences and SaaS guidelines.

---

## 🏃 Next Steps
- Continue building out remaining pages (Roadmap visualization, Live D3 Skill Graph, AI Career Coach Chat Interface).
- Refine automated error states and skeleton loaders.
- Finalize production deployment setup (Vercel + Railway/Docker).

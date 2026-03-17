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
- Developed a weighted scoring algorithm covering **19 companies** and 7 different evaluation components.
- Seeded the database with **19 detailed company hiring blueprints** — FAANG (Google, Amazon, Meta, Microsoft, Apple), Indian Unicorns (Flipkart, CRED, Razorpay, PhonePe, Groww, Swiggy, Meesho, Zepto, Blinkit), IT Services (TCS, Infosys, Wipro), and Global Products (Adobe, Salesforce).
- Each blueprint includes: DSA thresholds, interview format & rounds, tech stack preferences, system design expectations, salary bands, and hiring process details.
- Populated the **HelixDB Skill Graph** with 200+ nodes and dependency edges, enabling topological sort analysis for learning paths.
- APIs exposed for computing and receiving Match Scores dynamically based on new user data.

### 5. Frontend & UI Pages (Completed)
We've focused significantly on turning the data into a beautiful, functional UI:
- **Dashboard (`/dashboard`):** Fully enriched with personalized data including GitHub/LeetCode readiness scores, AI-generated action items, recent activities, gap analysis, and Recharts profile radar/breakdown charts. Sync Now triggers platform data refresh with toast notifications.
- **Company Explorer (`/companies`):** Refined into a modern SaaS standard with clear spacing, color-coding, card interactivity, hover effects, and a highly scannable grid layout for all 19 companies.
- **Company Detail Page (`/company/[slug]`):** 9-tab layout fully wired to dynamic API data:
  - **Overview** — DSA topic frequency, readiness, interview timeline
  - **DSA Requirements** — topic distribution, contest expectations
  - **System Design** — core topics, must-know designs from DB
  - **Projects** — company-specific project recommendations & preferred tech stack
  - **Interview Format** — rounds, dos/don'ts, insider tips, interview stats
  - **Resources** — curated DSA, System Design, Behavioral resources with links
  - **Reviews** — real interview experiences with difficulty ratings & offer outcomes
  - **Skill Gap Analysis** — readiness breakdown per area
  - **Preparation Strategy** — step-by-step roadmap with weekly plans
- **Profile & Integrations (`/profile`):** Editable profile with role-based fields, GitHub/LeetCode/Resume integration status.
- **Settings Page (`/settings`):** Interactive handlers for Export PDF, Download JSON, Clear Cache, Delete Account (with confirmation dialog), Dark/Light mode toggle, and compact view.
- **Theming:** Stabilized Tailwind configuration for consistent Light mode across all pages.

### 6. Data Enrichment (Completed)
- Curated and seeded enrichment data for all 19 companies covering:
  - **Projects:** Impressive project recommendations with descriptions, tags, complexity, and estimated hours.
  - **Resources:** DSA prep sheets, System Design courses, Behavioral guides, and practice platforms with URLs.
  - **Interview Reviews:** Real interview round experiences with questions, difficulty, outcomes, and candidate quotes.
  - **Insider Tips & Dos/Don'ts:** Company-specific interview advice.
  - **Interview Stats:** Success rates, average rounds, timelines, and offer rates.

---

## 🏃 Next Steps
- Build remaining pages: Roadmap Visualization, Live D3 Skill Graph, AI Career Coach Chat Interface, DSA Tracker, Career Simulator.
- Wire Match Score computation to user's synced profile data.
- Implement agent-powered Skill Gap Analysis (live gap detection using HelixDB traversal).
- Add skeleton loaders and refined error states across all pages.
- Finalize production deployment setup (Vercel + Railway/Docker).

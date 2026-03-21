# MintKey — Future Enhancements

Ideas discussed but deferred for future implementation.

## Auto-Sync Enhancements
- [ ] **Sync Analytics Card** — Dashboard card showing sync stats: "Last 7 days: 14 syncs, 847 contributions tracked"
- [ ] **Per-platform intervals** — Different sync frequencies per platform (e.g., GitHub hourly, CodeChef daily)
- [ ] **Sync History Log** — Expandable section in Settings showing last 5 syncs with timestamps and outcomes
- [ ] **Browser Push Notifications** — Notification API: "Your data was synced in the background" (requires user permission)
- [ ] **Smart Pre-scheduling** — Service worker pre-syncs data before user's typical login time so data is ready

## Platform Enhancements
- [ ] **Codeforces integration** — Add as a 5th platform
- [ ] **GeeksForGeeks integration** — Problem-solving tracker

## UI Enhancements
- [ ] **Onboarding flow** — Guide new users through connecting platforms, uploading resume, setting target companies
- [ ] **Mobile responsiveness audit** — Ensure all pages look good on mobile

## Agent Layer (from project spec)
- [ ] **8 LLM Agents** — GitHub Analyst, DSA Analyst, Resume Parser, Trend Watcher, Company Expert, Gap Finder, Roadmap Builder, Career Coach
- [ ] **Roadmap page** (`/roadmap/[company]`) — Week-by-week preparation plan
- [ ] **Career Coach page** — AI coaching messages

## Learning Platforms (New Scopes)
- [ ] **Aptitude Engine** — Pre-generated quiz system for logical, quantitative, verbal, and data interpretation topics (zero runtime LLM cost).
- [ ] **D3.js Algorithm Visualizer** — Interactive animated visualizer for 28 core algorithms (Sorting, Searching, Two Pointers, Trees).
- [ ] **LLM Explanations Cache** — Explanations generated on-demand by Agent 9 and cached for future users to minimize API costs.
- [ ] **Career "What-If" Simulator** — Real-time slider-based calculator showing project score impact of hypothetical scenarios.
- [ ] **Cheatsheets & Patterns Library** — Curated reference cards and templates (16 DSA patterns).

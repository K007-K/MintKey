# MintKey — Practice Hub & Problem Detail: Complete Spec Reference

> **CORE PRINCIPLE**: MintKey is NOT a prototype. It is a production platform
> for real users. Every page must work fully. No empty states, no NULL data,
> no throwaway layouts, no shortcuts. Premium quality, always.

---

## PROJECT STANDARDS (NEVER FORGET THESE)

1. **No empty states disguised as "coming soon"** — if a page exists, it works fully
2. **No NULL data fields** — if the UI expects content, the content exists
3. **No throwaway layouts** — if the spec says split-pane with tabs, we build split-pane with tabs
4. **No shortcuts on state management** — URL-driven filters, optimistic updates, auto-save, proper caching
5. **No "good enough" design** — every pixel matches the premium standard defined in the product spec
6. **Every interaction must feel intentional** — hover states, transitions, loading skeletons, error states
7. **Data must be real** — seed scripts, enrichment scripts, AI generation — whatever it takes
8. **Performance matters** — virtualized lists, parallel queries, cached responses, debounced inputs

---

## PRACTICE HUB (`/practice`) — FULL SPEC

### Page Layout: 5 Zones

1. **Zone 1 — Page Header**: Title + subtitle + live debounced search (200ms)
2. **Zone 2 — Stats Bar**: 4 metric cards that recalculate per-plan (Total, Solved, Attempted, Accuracy%)
3. **Zone 3 — Study Plan Sidebar (left, 220px)**: Plan list with progress bars + "My Progress" summary + streak flame
4. **Zone 4 — Filter Bar + Problem Table**: Main content area with filter pills + dense problem table
5. **Zone 5 — Pagination Footer**: Page pills, prev/next, rows-per-page selector (25/50/100), count display

### Filter System (4 Dimensions, AND-combined)

1. **Source Pills**: All / NeetCode / CSES / Striver / Blind 75 — filters by `study_plans TEXT[]` overlap
2. **Difficulty Pills**: All / Easy / Medium / Hard — OR within dimension, AND with other dimensions
3. **Pattern Dropdown**: 16 DSA patterns dropdown — filters by `pattern` column
4. **Status Toggle**: iOS-style "Unsolved only" toggle — hides `status = 'solved'` problems

**Filter Persistence**: ALL filter state stored in URL query params, NOT React useState.
URL is the single source of truth. Bookmarkable, shareable, survives navigation.

### Problem Table: 6 Columns

| Col | Width | Content |
|-----|-------|---------|
| Status | 50px | Circle icon (solved=teal check, attempted=amber half, unsolved=gray ring). Click → 3-option popover |
| LC# | 60px | Monospace, gray. CSES problems show "C-1068" format |
| Title | ~40% flex | Clickable link to detail page. **Pattern subtitle below title**. Bookmark icon if starred |
| Difficulty | 90px | Colored pill badge (green/amber/red) |
| Tags | 160px | 2-3 tag pills + "+N more" overflow with tooltip |
| Solve | 80px | Ghost "Solve ↗" button — opens LeetCode/CSES in new tab |

Row height: 48px. Dense. No wrapping.

### Smart Features

- **Auto-sync detection**: LeetCode sync → auto-mark problems as solved via slug matching
- **Streak counter**: Consecutive-days flame with pulse animation in sidebar
- **Company tag surfacing**: Show company circles if problem matches user's target companies
- **"This week" highlighting**: Teal left-border + "This week" pill for roadmap problems
- **Confetti celebration**: Burst animation when completing a section
- **Recommended row highlighting**: Current week's roadmap tasks highlighted

### State Management

- **URL State**: plan, filters, page, search, unsolved toggle → query params
- **Server State (React Query)**: `['practice','problems',filters]`, `['practice','stats',plan]`, `['practice','plans']`
- **Local UI State**: popover visibility, hints open/closed
- **Persistent State (Zustand)**: bookmarks, coach context

---

## PROBLEM DETAIL (`/practice/[id]`) — FULL SPEC

### Page Layout: Split-Pane

- **Left half (55%)**: Problem content (statement, examples, constraints, hints, solve button)
- **Right half (45%)**: Learning tools (4 tabs: Approach · Solution · Notes · Similar)
- **Sidebar auto-collapses** to icon-only mode when detail page opens

### Left Half

1. **Breadcrumb**: "Practice → NeetCode 150 → Arrays & Hashing → Two Sum" (all clickable)
2. **Problem Header**: LC#, title (24px bold), difficulty pill, pattern pill, source badge, company circles
3. **Status Controls**: "Mark Solved" / "Mark Attempted" / "Bookmark" buttons (top-right)
4. **Problem Statement**: Full HTML-rendered description + examples (styled code blocks) + constraints (bullets)
5. **Hints Section**: Progressive reveal — "Show Hint 1" → "Show Hint 2" → "Show Hint 3"
6. **Solve Button**: Full-width teal CTA "Open on LeetCode ↗" + "Solve it there, mark status here" note
7. **Timer**: Elapsed time since page load → feeds `time_spent_sec`

### Right Half — 4 Tabs

**Tab 1 — Approach (default)**
- "What is this problem really asking?" — plain English restatement
- "Which pattern does this fit?" — pattern name + WHY it applies
- "Step-by-step approach" — numbered walkthrough, key insights highlighted teal
- "Complexity Analysis" — Time/Space as colored pills
- Two CTAs: "Open LeetCode" (primary) + "Show me the solution" (secondary ghost)

**Tab 2 — Solution**
- Sub-tabs: Python · Java · C++
- Syntax-highlighted code block with copy button + line numbers
- Line-range annotations explaining the code

**Tab 3 — Notes**
- Personal notes textarea (auto-save on blur → `user_problem_progress.notes`)
- Quick-tag chips: "Revisit", "Tricky", "Favourite"
- "Revisit" tag → appears in Practice Hub "Problems to revisit" filter

**Tab 4 — Similar**
- 5-8 related problems (matched by pattern > tags > study plan adjacency)
- Each shows: title, difficulty badge, solve status
- Clicking navigates to that problem's detail page

### Cross-Page Connections

- **Breadcrumb → Practice Hub**: Returns with same filters active
- **Roadmap banner**: "This problem is in your Google Roadmap — Week 4, Day 2" if applicable
- **CoachFAB**: Floating "Ask Coach" with pre-loaded problem context
- **Company tags → Company Blueprint**: Click "Google" → `/company/google`

---

## CURRENT STATE vs SPEC — GAP TRACKER

### Practice Hub Gaps (as of March 30, 2026)

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 1 | Study plan sidebar (left 220px) | P0 | ❌ Not built |
| 2 | URL-based filter state (query params) | P0 | ❌ Using useState |
| 3 | Live debounced search | P0 | ❌ Not built |
| 4 | Pattern dropdown filter | P0 | ❌ Not built |
| 5 | Status circle popover (3 options) | P1 | ❌ Not built |
| 6 | Pattern subtitle under title | P1 | ❌ Not built |
| 7 | Stats recalculate per selected plan | P1 | ❌ Stats are global |
| 8 | Rows per page selector | P2 | ❌ Fixed at 50 |
| 9 | Tag overflow (+N more) | P2 | ❌ Tags just wrap |
| 10 | Streak flame counter | P2 | ❌ Not built |
| 11 | Company tag surfacing | P3 | ❌ Not built |
| 12 | "This week" roadmap highlighting | P3 | ❌ Not built |
| 13 | Confetti on section complete | P3 | ❌ Not built |
| 14 | Unsolved toggle (iOS-style) | P1 | ❌ Using dropdown |

### Problem Detail Gaps (as of March 30, 2026)

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 1 | Split-pane layout (55/45) | P0 | ❌ Single column |
| 2 | 4-tab system (Approach/Solution/Notes/Similar) | P0 | ❌ Stacked cards |
| 3 | Breadcrumb navigation | P0 | ❌ Just "← Back" |
| 4 | Problem statement with examples | P0 | ❌ description NULL |
| 5 | Progressive hint reveal | P1 | ❌ hints NULL |
| 6 | Approach tab (AI explanation) | P1 | ❌ No Agent 9 |
| 7 | Solution tab (multi-language code) | P1 | ❌ solution_code NULL |
| 8 | Notes tab (auto-save + quick-tags) | P1 | ❌ Not built |
| 9 | Timer (elapsed + time_spent_sec) | P2 | ❌ Not built |
| 10 | Sidebar auto-collapse | P2 | ❌ Not built |
| 11 | Roadmap banner connection | P3 | ❌ Not built |
| 12 | CoachFAB with context | P3 | ❌ Not built |
| 13 | Company tag → Company Blueprint | P3 | ❌ Tags are static |

### Data Gaps (as of March 30, 2026)

| Field | Table | Current State |
|-------|-------|---------------|
| description | external_problems | NULL for all 1134 |
| hints | external_problems | NULL for all 1134 |
| solution_approach | external_problems | NULL for all 1134 |
| solution_code | external_problems | NULL for all 1134 |
| complexity_analysis | external_problems | NULL for all 1134 |
| time_spent_sec | user_problem_progress | Column may not exist |
| notes | user_problem_progress | Column may not exist |
| attempts_count | user_problem_progress | Column may not exist |
| bookmarked | user_problem_progress | Column may not exist |
| tags (revisit/tricky/fav) | user_problem_progress | Column may not exist |

---

## BUILD ORDER (Recommended)

### Phase 1: Practice Hub Layout Rebuild (No new data needed)
- Study plan sidebar with progress bars
- URL-based filter state (useSearchParams)
- Live debounced search
- Pattern dropdown filter
- Status circle popover
- Pattern subtitle under title in table
- Stats that recalculate per plan
- Rows per page selector
- Tag overflow with tooltip
- iOS-style unsolved toggle

### Phase 2: Problem Detail Split-Pane + Tabs (No new data needed for structure)
- Split-pane layout (55/45)
- Breadcrumb navigation
- 4-tab system on right half
- Notes tab with auto-save (needs DB column)
- Timer
- Similar problems tab
- Sidebar auto-collapse

### Phase 3: Data Enrichment Pipeline (Content generation)
- DB migration: add missing columns (time_spent_sec, notes, attempts_count, bookmarked, tags)
- Populate descriptions for top 200 problems (NeetCode 150 + CSES top 50)
- Populate hints (2-3 per problem)
- Populate solution_approach
- Populate solution_code (Python + Java + C++)
- Populate complexity_analysis

### Phase 4: Smart Features (Cross-page connections)
- Streak flame counter
- Auto-sync detection for practice problems
- Company tag surfacing
- "This week" roadmap highlighting
- Confetti celebration
- CoachFAB with context
- Roadmap banner on detail page

---

*Last updated: March 30, 2026*
*This file is the single source of truth for Practice Hub & Problem Detail requirements.*

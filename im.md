# Roadmap Generation — Full Implementation Spec
### For: Antigravity Dev Team
### Platform: Career Prep Roadmap (Google L3 SWE & similar targets)
### Version: 1.0

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema](#3-database-schema)
4. [External Integrations](#4-external-integrations)
5. [Roadmap Generation Pipeline](#5-roadmap-generation-pipeline)
6. [Scoring Engine](#6-scoring-engine)
7. [Weekly Plan System](#7-weekly-plan-system)
8. [Phase Locking System](#8-phase-locking-system)
9. [Task Board (Kanban)](#9-task-board-kanban)
10. [Real-time Sync (LeetCode + WebSocket)](#10-real-time-sync-leetcode--websocket)
11. [Frontend Architecture](#11-frontend-architecture)
12. [API Endpoints Reference](#12-api-endpoints-reference)
13. [Ask Coach (AI Chat)](#13-ask-coach-ai-chat)
14. [Score Impact Simulator](#14-score-impact-simulator)
15. [Progress Analytics](#15-progress-analytics)
16. [Caching Strategy](#16-caching-strategy)
17. [Environment Variables](#17-environment-variables)

---

## 1. System Overview

The roadmap page is a personalized interview preparation tracker. When a user targets a company + level (e.g. Google L3 SWE), the platform:

1. Runs a **gap analysis** against that company's known interview bar using the user's LeetCode and GitHub data
2. Calls the **Claude AI API** to generate a structured 24-week roadmap (phases, weekly plans, daily plans, tasks)
3. Persists the roadmap to **PostgreSQL**
4. Continuously syncs the user's **LeetCode submissions** every 30 minutes via a background job
5. Recalculates the **match score** on every sync and emits updates via **WebSocket**
6. The frontend renders all of this from REST API calls + live WebSocket events

### High-Level Data Flow

```
[User Onboarding] → [Gap Analysis Engine] → [Claude AI] → [JSON Roadmap] → [PostgreSQL]
                                                                                  ↓
[LeetCode Sync (cron)] → [Submission Processor] → [Score Recalculator] → [WebSocket Push]
                                                                                  ↓
                                                              [Frontend React Query Cache Invalidated]
```

---

## 2. Tech Stack

### Backend
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express.js (or Fastify for performance)
- **Database:** PostgreSQL 15 via Prisma ORM
- **Cache/Queue:** Redis + BullMQ
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **WebSocket:** Socket.io
- **Auth:** JWT (access token) + refresh token in httpOnly cookie
- **Background Jobs:** BullMQ workers (LeetCode sync, score recalc)
- **PDF Export:** Puppeteer

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Data Fetching:** TanStack React Query v5
- **Client State:** Zustand
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Real-time:** Socket.io-client
- **Dates:** date-fns

### Infrastructure
- **Hosting:** Railway / Render / AWS EC2
- **DB Hosting:** Supabase or Railway PostgreSQL
- **Redis:** Upstash or Railway Redis
- **File Storage:** AWS S3 (for PDF exports)

---

## 3. Database Schema

### Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

model User {
  id                  String   @id @default(uuid())
  email               String   @unique
  name                String
  passwordHash        String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  profile             UserProfile?
  roadmaps            Roadmap[]
  lcSubmissions       LcSubmission[]
  refreshTokens       RefreshToken[]
}

model UserProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])

  // Onboarding data
  currentRole         String?  // e.g. "Software Engineer"
  currentCompany      String?
  yearsOfExperience   Int?
  leetcodeUsername    String?
  githubUsername      String?
  techStack           String[] // ["Python", "JavaScript", "React"]

  // Computed (updated by sync jobs)
  lastLcSyncAt        DateTime?
  githubSyncedAt      DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// ─────────────────────────────────────────────
// ROADMAP
// ─────────────────────────────────────────────

model Roadmap {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])

  // Target
  targetCompany       String   // "google"
  targetLevel         String   // "L3 SWE"
  totalWeeks          Int      @default(24)
  targetScore         Int      @default(85)

  // Computed scores (updated by score recalculator)
  currentScore        Float    @default(0)
  overallProgress     Float    @default(0)  // 0–100
  streakDays          Int      @default(0)
  lastSolvedAt        DateTime?
  problemsThisWeek    Int      @default(0)
  lastSyncedAt        DateTime?

  // Generation metadata
  generationHash      String?  // cache key for AI generation
  generatedAt         DateTime?
  currentWeek         Int      @default(1)

  // Relations
  phases              Phase[]
  weekPlans           WeekPlan[]
  tasks               Task[]
  scoreSnapshots      ScoreSnapshot[]
  skillProgress       SkillProgress[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([userId, targetCompany])
}

// ─────────────────────────────────────────────
// PHASES
// ─────────────────────────────────────────────

model Phase {
  id                  String      @id @default(uuid())
  roadmapId           String
  roadmap             Roadmap     @relation(fields: [roadmapId], references: [id])

  phaseNumber         Int         // 1, 2, 3, 4
  title               String      // "DSA Foundation"
  weekStart           Int         // 1
  weekEnd             Int         // 5
  status              PhaseStatus @default(LOCKED)
  progress            Float       @default(0)  // 0–100
  unlockCondition     Json        // see Phase Locking section

  weekPlans           WeekPlan[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

enum PhaseStatus {
  UNLOCKED     // in progress — renamed from IN_PROGRESS for clarity
  LOCKED
  DONE
}

// ─────────────────────────────────────────────
// WEEK PLANS
// ─────────────────────────────────────────────

model WeekPlan {
  id                  String   @id @default(uuid())
  roadmapId           String
  roadmap             Roadmap  @relation(fields: [roadmapId], references: [id])
  phaseId             String
  phase               Phase    @relation(fields: [phaseId], references: [id])

  weekNumber          Int
  title               String   // "Foundation & Gap Filling: Two Pointers"
  hoursPerDay         Int      @default(4)
  focusTopic          String   // "Two Pointers"
  progress            Float    @default(0)

  // Daily plan (Mon–Sun)
  dailyPlan           Json     // { monday: "...", tuesday: "...", ... }

  // DSA task for this week
  dsaTaskLabel        String   // "Solve 5 Two Pointers problems on LeetCode"
  dsaLcTag            String   // "two-pointers" — maps to LeetCode tag
  dsaCountRequired    Int      // 5
  dsaCountDone        Int      @default(0)
  dsaDifficulty       String   // "medium"
  dsaStatus           String   @default("upcoming") // "upcoming" | "in_progress" | "done"

  // Project task
  projectTaskLabel    String?
  projectTaskDone     Boolean  @default(false)
  projectScoreImpact  Int      @default(0)
  projectDifficulty   String?
  projectHours        Int?

  // Resources
  resources           Json[]   // [{ type: "article", title: "...", url: "..." }]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([roadmapId, weekNumber])
}

// ─────────────────────────────────────────────
// TASKS (for Task Board / Kanban)
// ─────────────────────────────────────────────

model Task {
  id                  String     @id @default(uuid())
  roadmapId           String
  roadmap             Roadmap    @relation(fields: [roadmapId], references: [id])

  type                TaskType   // DSA | PROJECT | SYSTEM_DESIGN
  title               String     // "Master Arrays Strings"
  difficulty          String     // "hard" | "medium" | "easy"
  estimatedWeeks      Int
  scoreImpact         Int        // +8, +7, etc.
  status              TaskStatus @default(TODO)

  // DSA-specific
  lcTag               String?    // "arrays" — links to LeetCode tag
  lcCountRequired     Int?
  lcCountDone         Int        @default(0)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

enum TaskType {
  DSA
  PROJECT
  SYSTEM_DESIGN
  STACK
  EXPERIENCE
  CONSISTENCY
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

// ─────────────────────────────────────────────
// SCORE SNAPSHOTS (time-series for charts)
// ─────────────────────────────────────────────

model ScoreSnapshot {
  id                  String   @id @default(uuid())
  roadmapId           String
  roadmap             Roadmap  @relation(fields: [roadmapId], references: [id])

  weekNumber          Int
  score               Float
  projectedScore      Float
  recordedAt          DateTime @default(now())

  @@index([roadmapId, recordedAt])
}

// ─────────────────────────────────────────────
// SKILL PROGRESS (per-topic DSA progress)
// ─────────────────────────────────────────────

model SkillProgress {
  id                  String   @id @default(uuid())
  roadmapId           String
  roadmap             Roadmap  @relation(fields: [roadmapId], references: [id])

  topic               String   // "Arrays Strings", "Dynamic Programming", "Graphs"
  lcTag               String   // "arrays", "dynamic-programming", "graph"
  solved              Int      @default(0)
  required            Int      // benchmark for target company/level
  progress            Float    @default(0)  // solved / required * 100

  updatedAt           DateTime @updatedAt

  @@unique([roadmapId, topic])
}

// ─────────────────────────────────────────────
// LEETCODE SUBMISSIONS (raw synced data)
// ─────────────────────────────────────────────

model LcSubmission {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])

  lcProblemId         String
  titleSlug           String
  title               String
  difficulty          String   // "Easy" | "Medium" | "Hard"
  tags                String[] // ["two-pointers", "array"]
  solvedAt            DateTime

  @@unique([userId, lcProblemId])
  @@index([userId, solvedAt])
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

model RefreshToken {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  token               String   @unique
  expiresAt           DateTime
  createdAt           DateTime @default(now())
}
```

### Company Benchmarks Config (stored in a JSON config file or separate table)

```typescript
// src/config/benchmarks.ts

export const COMPANY_BENCHMARKS: Record<string, CompanyBenchmark> = {
  "google-l3": {
    targetScore: 85,
    totalWeeks: 24,
    weights: {
      dsa: 0.40,
      projects: 0.20,
      systemDesign: 0.15,
      stackAlignment: 0.10,
      experience: 0.10,
      consistency: 0.05,
    },
    dsaTopics: [
      { tag: "arrays",              lcTag: "array",              required: 30, weight: 0.08 },
      { tag: "strings",             lcTag: "string",             required: 20, weight: 0.06 },
      { tag: "two-pointers",        lcTag: "two-pointers",       required: 15, weight: 0.05 },
      { tag: "dynamic-programming", lcTag: "dynamic-programming",required: 25, weight: 0.08 },
      { tag: "graphs",              lcTag: "graph",              required: 20, weight: 0.07 },
      { tag: "trees",               lcTag: "tree",               required: 20, weight: 0.07 },
      { tag: "hash-maps",           lcTag: "hash-table",         required: 15, weight: 0.05 },
    ],
    preferredStack: ["Go", "Java", "Python", "C++"],
    projectQualityMin: 70,
  },
};
```

---

## 4. External Integrations

### 4.1 LeetCode GraphQL API

LeetCode has an unofficial GraphQL API. Use the user's linked LeetCode username (no auth required for public profiles).

**Endpoint:** `https://leetcode.com/graphql`

```typescript
// src/integrations/leetcode.ts

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

// Fetch user's submission stats + solved tags
export async function fetchLcProfile(username: string) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
        tagProblemCounts {
          advanced {
            tagName
            tagSlug
            problemsSolved
          }
          intermediate {
            tagName
            tagSlug
            problemsSolved
          }
          fundamental {
            tagName
            tagSlug
            problemsSolved
          }
        }
      }
    }
  `;

  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { username } }),
  });

  const data = await res.json();
  return data.data.matchedUser;
}

// Fetch recent accepted submissions (last 50)
export async function fetchRecentSubmissions(username: string) {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { username, limit: 50 } }),
  });

  const data = await res.json();
  return data.data.recentAcSubmissionList;
}

// Fetch problem details including tags (needed for tag-based tracking)
export async function fetchProblemDetails(titleSlug: string) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        difficulty
        topicTags {
          name
          slug
        }
      }
    }
  `;

  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { titleSlug } }),
  });

  const data = await res.json();
  return data.data.question;
}
```

**Rate limiting note:** LeetCode does not officially expose this API. Add a 500ms delay between problem detail fetches to avoid being blocked. Cache problem tag data in Redis permanently (tags don't change).

### 4.2 GitHub REST API

```typescript
// src/integrations/github.ts

const GITHUB_API = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${process.env.GITHUB_PAT}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

export async function fetchGithubRepos(username: string) {
  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=30`,
    { headers }
  );
  return res.json();
}

export async function fetchGithubEvents(username: string) {
  const res = await fetch(
    `${GITHUB_API}/users/${username}/events?per_page=100`,
    { headers }
  );
  return res.json();
}

// Used for consistency score — count commit days in last 90 days
export function calcCommitConsistency(events: any[]): number {
  const pushEvents = events.filter((e) => e.type === "PushEvent");
  const uniqueDays = new Set(
    pushEvents.map((e) => e.created_at.substring(0, 10))
  );
  return Math.min((uniqueDays.size / 90) * 100, 100);
}
```

### 4.3 Claude AI API

```typescript
// src/integrations/claude.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateRoadmapWithClaude(prompt: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<any> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: prompt.userPrompt,
      },
    ],
    system: prompt.systemPrompt,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Claude is instructed to return pure JSON — parse it
  try {
    return JSON.parse(text);
  } catch {
    // Attempt to extract JSON if Claude added any wrapper text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Claude returned invalid JSON");
  }
}
```

---

## 5. Roadmap Generation Pipeline

This is the core feature. It runs when a user creates a roadmap for the first time or clicks "Regenerate Roadmap."

### 5.1 Generation Service

```typescript
// src/services/roadmapGenerationService.ts

import crypto from "crypto";
import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { fetchLcProfile } from "../integrations/leetcode";
import { fetchGithubRepos, fetchGithubEvents, calcCommitConsistency } from "../integrations/github";
import { generateRoadmapWithClaude } from "../integrations/claude";
import { COMPANY_BENCHMARKS } from "../config/benchmarks";

export async function generateRoadmap(userId: string, targetCompany: string, targetLevel: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("User profile not found");

  // STEP 1: Run gap analysis
  const gapScores = await computeGapScores(profile, targetCompany, targetLevel);

  // STEP 2: Check cache
  const benchmarkKey = `${targetCompany}-${targetLevel}`;
  const benchmark = COMPANY_BENCHMARKS[benchmarkKey];
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ targetCompany, targetLevel, totalWeeks: benchmark.totalWeeks, gapScores }))
    .digest("hex");

  const cached = await redis.get(`roadmap:gen:${hash}`);
  let aiResponse = cached ? JSON.parse(cached) : null;

  // STEP 3: Call Claude if not cached
  if (!aiResponse) {
    const { systemPrompt, userPrompt } = buildGenerationPrompt(profile, gapScores, benchmark, targetCompany, targetLevel);
    aiResponse = await generateRoadmapWithClaude({ systemPrompt, userPrompt });
    await redis.setex(`roadmap:gen:${hash}`, 60 * 60 * 24 * 7, JSON.stringify(aiResponse)); // 7 day cache
  }

  // STEP 4: Persist to DB in a transaction
  const roadmap = await prisma.$transaction(async (tx) => {
    // Upsert the roadmap record
    const rm = await tx.roadmap.upsert({
      where: { userId_targetCompany: { userId, targetCompany } },
      create: {
        userId,
        targetCompany,
        targetLevel,
        totalWeeks: benchmark.totalWeeks,
        targetScore: benchmark.targetScore,
        generationHash: hash,
        generatedAt: new Date(),
        currentScore: computeTotalScore(gapScores, benchmark.weights),
      },
      update: {
        generationHash: hash,
        generatedAt: new Date(),
      },
    });

    // Delete old phases, weeks, tasks (for regeneration)
    await tx.task.deleteMany({ where: { roadmapId: rm.id } });
    await tx.weekPlan.deleteMany({ where: { roadmapId: rm.id } });
    await tx.phase.deleteMany({ where: { roadmapId: rm.id } });

    // Insert phases
    const phases: any[] = [];
    for (const phaseData of aiResponse.phases) {
      const phase = await tx.phase.create({
        data: {
          roadmapId: rm.id,
          phaseNumber: phaseData.phase_number,
          title: phaseData.title,
          weekStart: phaseData.week_start,
          weekEnd: phaseData.week_end,
          status: phaseData.phase_number === 1 ? "UNLOCKED" : "LOCKED",
          unlockCondition: phaseData.unlock_condition,
        },
      });
      phases.push(phase);
    }

    // Insert week plans
    for (const weekData of aiResponse.weeks) {
      const phase = phases.find(
        (p) => weekData.week_number >= p.weekStart && weekData.week_number <= p.weekEnd
      );
      await tx.weekPlan.create({
        data: {
          roadmapId: rm.id,
          phaseId: phase.id,
          weekNumber: weekData.week_number,
          title: weekData.title,
          hoursPerDay: weekData.hours_per_day,
          focusTopic: weekData.focus_topic,
          dailyPlan: weekData.daily_plan,
          dsaTaskLabel: weekData.dsa_task.label,
          dsaLcTag: weekData.dsa_task.lc_tag,
          dsaCountRequired: weekData.dsa_task.count,
          dsaDifficulty: weekData.dsa_task.difficulty,
          projectTaskLabel: weekData.project_task?.label,
          projectScoreImpact: weekData.project_task?.score_impact ?? 0,
          projectDifficulty: weekData.project_task?.difficulty,
          projectHours: weekData.project_task?.hours,
          resources: weekData.resources ?? [],
        },
      });
    }

    // Insert tasks (for Kanban board)
    for (const taskData of aiResponse.tasks) {
      await tx.task.create({
        data: {
          roadmapId: rm.id,
          type: taskData.type.toUpperCase(),
          title: taskData.title,
          difficulty: taskData.difficulty,
          estimatedWeeks: taskData.estimated_weeks,
          scoreImpact: taskData.score_impact,
          lcTag: taskData.lc_tag ?? null,
          lcCountRequired: taskData.lc_count_required ?? null,
        },
      });
    }

    // Insert initial skill progress rows
    for (const topic of benchmark.dsaTopics) {
      await tx.skillProgress.upsert({
        where: { roadmapId_topic: { roadmapId: rm.id, topic: topic.tag } },
        create: {
          roadmapId: rm.id,
          topic: topic.tag,
          lcTag: topic.lcTag,
          required: topic.required,
          solved: 0,
          progress: 0,
        },
        update: {},
      });
    }

    // Initial score snapshot
    await tx.scoreSnapshot.create({
      data: {
        roadmapId: rm.id,
        weekNumber: 1,
        score: rm.currentScore,
        projectedScore: computeProjectedScore(rm.currentScore, benchmark.targetScore, benchmark.totalWeeks, 1),
      },
    });

    return rm;
  });

  return roadmap;
}
```

### 5.2 Gap Analysis

```typescript
// src/services/gapAnalysisService.ts

export async function computeGapScores(
  profile: UserProfile,
  targetCompany: string,
  targetLevel: string
): Promise<GapScores> {
  const benchmarkKey = `${targetCompany}-${targetLevel}`;
  const benchmark = COMPANY_BENCHMARKS[benchmarkKey];

  const scores: GapScores = {
    dsa: 0,
    projects: 0,
    systemDesign: 0,
    stackAlignment: 0,
    experience: 0,
    consistency: 0,
  };

  // --- DSA Score ---
  if (profile.leetcodeUsername) {
    const lcProfile = await fetchLcProfile(profile.leetcodeUsername);
    scores.dsa = computeDsaScore(lcProfile.tagProblemCounts, benchmark.dsaTopics);
  }

  // --- Projects + System Design + Stack ---
  if (profile.githubUsername) {
    const repos = await fetchGithubRepos(profile.githubUsername);
    scores.projects = computeProjectScore(repos);
    scores.systemDesign = inferSystemDesignScore(repos);
    scores.stackAlignment = computeStackScore(repos, profile.techStack, benchmark.preferredStack);

    // --- Consistency ---
    const events = await fetchGithubEvents(profile.githubUsername);
    scores.consistency = calcCommitConsistency(events);
  }

  // --- Experience ---
  scores.experience = computeExperienceScore(profile.yearsOfExperience ?? 0, targetLevel);

  return scores;
}

function computeDsaScore(tagCounts: any, benchmarkTopics: any[]): number {
  let total = 0;
  let totalWeight = 0;

  for (const topic of benchmarkTopics) {
    const allTags = [
      ...(tagCounts.advanced ?? []),
      ...(tagCounts.intermediate ?? []),
      ...(tagCounts.fundamental ?? []),
    ];
    const match = allTags.find((t: any) => t.tagSlug === topic.lcTag);
    const solved = match?.problemsSolved ?? 0;
    const topicScore = Math.min(solved / topic.required, 1) * topic.weight;
    total += topicScore;
    totalWeight += topic.weight;
  }

  return (total / totalWeight) * 100;
}

function computeProjectScore(repos: any[]): number {
  if (!repos.length) return 0;
  // Heuristics: stars, description presence, language variety, last commit recency
  let score = 0;
  for (const repo of repos.slice(0, 5)) {
    if (repo.description) score += 10;
    if (repo.stargazers_count > 0) score += 5;
    if (!repo.fork) score += 10;
    const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 180) score += 10;
  }
  return Math.min(score, 100);
}

function computeStackScore(repos: any[], userStack: string[], preferredStack: string[]): number {
  const repoLanguages = repos.map((r) => r.language).filter(Boolean);
  const allUserStack = [...new Set([...userStack, ...repoLanguages])];
  const matches = allUserStack.filter((lang) =>
    preferredStack.some((p) => p.toLowerCase() === lang.toLowerCase())
  );
  return Math.min((matches.length / preferredStack.length) * 100, 100);
}

function computeExperienceScore(yoe: number, targetLevel: string): number {
  // Google L3 typically expects 0–3 YOE
  const yoeExpected = { "L3": 1.5, "L4": 3, "L5": 6 }[targetLevel.split(" ")[0]] ?? 2;
  return Math.min((yoe / yoeExpected) * 100, 100);
}
```

### 5.3 Claude Prompt Builder

```typescript
// src/services/promptBuilder.ts

export function buildGenerationPrompt(
  profile: UserProfile,
  gapScores: GapScores,
  benchmark: CompanyBenchmark,
  targetCompany: string,
  targetLevel: string
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an expert technical interview coach specializing in FAANG interview preparation.
Generate a personalized interview preparation roadmap as VALID JSON ONLY.
Do NOT include markdown, backticks, or any explanatory text — output the raw JSON object and nothing else.
The JSON must strictly match the schema provided.`;

  const userPrompt = `
TARGET: ${targetCompany.toUpperCase()} ${targetLevel}
TIMELINE: ${benchmark.totalWeeks} weeks
TARGET MATCH SCORE: ${benchmark.targetScore}%
HOURS PER DAY: 4

GAP ANALYSIS (0 = no progress, 100 = target met):
- DSA Mastery: ${Math.round(gapScores.dsa)}% 
- Projects: ${Math.round(gapScores.projects)}%
- System Design: ${Math.round(gapScores.systemDesign)}%
- Stack Alignment: ${Math.round(gapScores.stackAlignment)}%
- Experience: ${Math.round(gapScores.experience)}%
- Consistency: ${Math.round(gapScores.consistency)}%

USER CONTEXT:
- Years of experience: ${profile.yearsOfExperience ?? "unknown"}
- Current stack: ${profile.techStack?.join(", ") || "unknown"}
- LeetCode username: ${profile.leetcodeUsername ?? "not linked"}

SCORING WEIGHTS:
${Object.entries(benchmark.weights).map(([k, v]) => `- ${k}: ${(v * 100).toFixed(0)}%`).join("\n")}

IMPORTANT INSTRUCTIONS:
- Focus weeks 1-3 on the weakest DSA tags (where gap is largest)
- Allocate more time to dimensions with largest gaps
- Score impact per task should reflect actual gap improvement potential
- Each week must have exactly one dsa_task with a specific lc_tag
- Week titles should be specific (e.g. "Foundation & Gap Filling: Two Pointers" not just "Week 2")
- Daily plan entries should be specific, actionable, and varied across the week
- Generate exactly ${benchmark.totalWeeks} weeks and 4 phases

OUTPUT JSON SCHEMA:
{
  "phases": [
    {
      "phase_number": 1,
      "title": "DSA Foundation",
      "week_start": 1,
      "week_end": 5,
      "unlock_condition": { "type": "always_unlocked" }
    },
    {
      "phase_number": 2,
      "title": "Projects & Stack",
      "week_start": 6,
      "week_end": 8,
      "unlock_condition": { "type": "or", "conditions": [{ "phase_progress": 1, "min": 60 }, { "week_reached": 6 }] }
    },
    {
      "phase_number": 3,
      "title": "System Design",
      "week_start": 9,
      "week_end": 10,
      "unlock_condition": { "type": "phase_progress", "phase": 2, "min": 50 }
    },
    {
      "phase_number": 4,
      "title": "Final Prep",
      "week_start": 11,
      "week_end": 24,
      "unlock_condition": { "type": "overall_progress", "min": 75 }
    }
  ],
  "weeks": [
    {
      "week_number": 1,
      "title": "Foundation: Arrays & Strings",
      "hours_per_day": 4,
      "focus_topic": "Arrays",
      "daily_plan": {
        "monday": "Study array traversal patterns and prefix sums",
        "tuesday": "Solve 3 easy array problems",
        "wednesday": "Study string manipulation patterns",
        "thursday": "Solve 3 easy string problems",
        "friday": "Timed practice: 2 medium problems in 45 mins",
        "saturday": "Review solutions, read editorials",
        "sunday": "Set up project boilerplate"
      },
      "dsa_task": {
        "label": "Solve 5 Arrays problems on LeetCode",
        "lc_tag": "array",
        "count": 5,
        "difficulty": "medium"
      },
      "project_task": {
        "label": "Project work",
        "score_impact": 3,
        "difficulty": "medium",
        "hours": 4
      },
      "resources": [
        { "type": "article", "title": "NeetCode Arrays guide", "url": "https://neetcode.io" }
      ]
    }
  ],
  "tasks": [
    {
      "title": "Master Arrays Strings",
      "type": "dsa",
      "difficulty": "hard",
      "estimated_weeks": 6,
      "score_impact": 8,
      "lc_tag": "array",
      "lc_count_required": 30
    },
    {
      "title": "Build Projects",
      "type": "project",
      "difficulty": "medium",
      "estimated_weeks": 4,
      "score_impact": 3
    }
  ]
}
`;

  return { systemPrompt, userPrompt };
}
```

---

## 6. Scoring Engine

### 6.1 Full Score Calculation

```typescript
// src/services/scoringService.ts

import { prisma } from "../lib/prisma";
import { COMPANY_BENCHMARKS } from "../config/benchmarks";

export async function recalculateScore(roadmapId: string): Promise<void> {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: { skillProgress: true, weekPlans: true, tasks: true, phases: true },
  });
  if (!roadmap) return;

  const benchmarkKey = `${roadmap.targetCompany}-${roadmap.targetLevel.split(" ")[0].toLowerCase()}`;
  const benchmark = COMPANY_BENCHMARKS[benchmarkKey] ?? COMPANY_BENCHMARKS["google-l3"];

  // --- DSA Score (0-100) ---
  const dsaScore = calcDsaScore(roadmap.skillProgress, benchmark.dsaTopics);

  // --- Project Score ---
  const projectTasks = roadmap.tasks.filter((t) => t.type === "PROJECT");
  const projectScore = projectTasks.length
    ? (projectTasks.filter((t) => t.status === "DONE").length / projectTasks.length) * 100
    : 0;

  // --- System Design Score ---
  const sdTasks = roadmap.tasks.filter((t) => t.type === "SYSTEM_DESIGN");
  const sdScore = sdTasks.length
    ? (sdTasks.filter((t) => t.status === "DONE").length / sdTasks.length) * 100
    : 0;

  // --- Stack / Experience / Consistency (seeded from gap analysis, improve as tasks done) ---
  const stackTasks = roadmap.tasks.filter((t) => t.type === "STACK");
  const stackScore = stackTasks.length
    ? (stackTasks.filter((t) => t.status === "DONE").length / stackTasks.length) * 100
    : 0;

  const expTasks = roadmap.tasks.filter((t) => t.type === "EXPERIENCE");
  const expScore = expTasks.length
    ? (expTasks.filter((t) => t.status === "DONE").length / expTasks.length) * 100
    : 0;

  const conTasks = roadmap.tasks.filter((t) => t.type === "CONSISTENCY");
  const consistencyScore = conTasks.length
    ? (conTasks.filter((t) => t.status === "DONE").length / conTasks.length) * 100
    : 0;

  // --- Weighted total ---
  const w = benchmark.weights;
  const totalScore =
    dsaScore * w.dsa +
    projectScore * w.projects +
    sdScore * w.systemDesign +
    stackScore * w.stackAlignment +
    expScore * w.experience +
    consistencyScore * w.consistency;

  // --- Overall progress (% of all tasks done) ---
  const allTasks = roadmap.tasks;
  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  const overallProgress = allTasks.length ? (doneTasks / allTasks.length) * 100 : 0;

  const previousScore = roadmap.currentScore;

  // --- Persist ---
  await prisma.roadmap.update({
    where: { id: roadmapId },
    data: { currentScore: totalScore, overallProgress },
  });

  // --- Save score snapshot if significant change ---
  if (Math.abs(totalScore - previousScore) >= 0.1) {
    await prisma.scoreSnapshot.create({
      data: {
        roadmapId,
        weekNumber: roadmap.currentWeek,
        score: totalScore,
        projectedScore: computeProjectedScore(
          totalScore,
          benchmark.targetScore,
          benchmark.totalWeeks,
          roadmap.currentWeek
        ),
      },
    });
  }

  // --- Evaluate phase unlocks ---
  await evaluatePhaseUnlocks(roadmapId, roadmap.phases, overallProgress);
}

function calcDsaScore(skillProgress: SkillProgress[], benchmarkTopics: any[]): number {
  let total = 0;
  let totalWeight = 0;
  for (const topic of benchmarkTopics) {
    const progress = skillProgress.find((s) => s.lcTag === topic.lcTag);
    const solved = progress?.solved ?? 0;
    const topicScore = Math.min(solved / topic.required, 1) * topic.weight;
    total += topicScore;
    totalWeight += topic.weight;
  }
  return totalWeight > 0 ? (total / totalWeight) * 100 : 0;
}

function computeProjectedScore(
  currentScore: number,
  targetScore: number,
  totalWeeks: number,
  currentWeek: number
): number {
  const progress = currentWeek / totalWeeks;
  return currentScore + (targetScore - currentScore) * progress;
}

export function computeTotalScore(gapScores: GapScores, weights: any): number {
  return (
    gapScores.dsa * weights.dsa +
    gapScores.projects * weights.projects +
    gapScores.systemDesign * weights.systemDesign +
    gapScores.stackAlignment * weights.stackAlignment +
    gapScores.experience * weights.experience +
    gapScores.consistency * weights.consistency
  );
}
```

---

## 7. Weekly Plan System

### 7.1 Week Detail Endpoint Handler

```typescript
// src/controllers/weekController.ts

export async function getWeekDetail(req: Request, res: Response) {
  const { roadmapId, weekNumber } = req.params;

  const week = await prisma.weekPlan.findUnique({
    where: { roadmapId_weekNumber: { roadmapId, weekNumber: parseInt(weekNumber) } },
  });

  if (!week) return res.status(404).json({ error: "Week not found" });

  // Compute progress
  const dsaProgress = Math.min(week.dsaCountDone / week.dsaCountRequired, 1);
  const projectProgress = week.projectTaskDone ? 1 : 0;
  const weekProgress = dsaProgress * 0.7 + projectProgress * 0.3;

  return res.json({
    ...week,
    progress: Math.round(weekProgress * 100),
    dsaTask: {
      label: week.dsaTaskLabel,
      lcTag: week.dsaLcTag,
      countRequired: week.dsaCountRequired,
      countDone: week.dsaCountDone,
      difficulty: week.dsaDifficulty,
      status: week.dsaStatus,
    },
    projectTask: {
      label: week.projectTaskLabel,
      done: week.projectTaskDone,
      scoreImpact: week.projectScoreImpact,
      difficulty: week.projectDifficulty,
      hours: week.projectHours,
    },
  });
}
```

### 7.2 Week Progress Update (called by LeetCode sync)

```typescript
// src/services/weekProgressService.ts

export async function updateWeekDsaProgress(
  roadmapId: string,
  lcTag: string,
  submissionsForTag: number
): Promise<void> {
  const currentWeek = await getCurrentActiveWeek(roadmapId);
  if (!currentWeek || currentWeek.dsaLcTag !== lcTag) return;

  const newCount = Math.min(submissionsForTag, currentWeek.dsaCountRequired);
  const newStatus =
    newCount >= currentWeek.dsaCountRequired
      ? "done"
      : newCount > 0
      ? "in_progress"
      : "upcoming";

  await prisma.weekPlan.update({
    where: { id: currentWeek.id },
    data: { dsaCountDone: newCount, dsaStatus: newStatus },
  });
}
```

---

## 8. Phase Locking System

```typescript
// src/services/phaseUnlockService.ts

export async function evaluatePhaseUnlocks(
  roadmapId: string,
  phases: Phase[],
  overallProgress: number
): Promise<void> {
  for (const phase of phases) {
    if (phase.status === "DONE") continue;

    const condition = phase.unlockCondition as any;
    const shouldUnlock = await checkUnlockCondition(condition, roadmapId, phases, overallProgress);

    if (shouldUnlock && phase.status === "LOCKED") {
      await prisma.phase.update({
        where: { id: phase.id },
        data: { status: "UNLOCKED" },
      });

      // Emit WebSocket event
      io.to(roadmapId).emit("phase_unlocked", {
        phaseId: phase.id,
        phaseNumber: phase.phaseNumber,
        title: phase.title,
      });
    }
  }
}

async function checkUnlockCondition(
  condition: any,
  roadmapId: string,
  phases: Phase[],
  overallProgress: number
): Promise<boolean> {
  switch (condition.type) {
    case "always_unlocked":
      return true;

    case "phase_progress": {
      const targetPhase = phases.find((p) => p.phaseNumber === condition.phase);
      return targetPhase ? targetPhase.progress >= condition.min : false;
    }

    case "overall_progress":
      return overallProgress >= condition.min;

    case "week_reached": {
      const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
      return roadmap ? roadmap.currentWeek >= condition.week_reached : false;
    }

    case "or":
      for (const sub of condition.conditions) {
        if (await checkUnlockCondition(sub, roadmapId, phases, overallProgress)) return true;
      }
      return false;

    case "and":
      for (const sub of condition.conditions) {
        if (!(await checkUnlockCondition(sub, roadmapId, phases, overallProgress))) return false;
      }
      return true;

    default:
      return false;
  }
}
```

**Phase unlock conditions used:**
| Phase | Condition |
|-------|-----------|
| Phase 1 — DSA Foundation | `always_unlocked` |
| Phase 2 — Projects & Stack | Phase 1 ≥ 60% **OR** week 6 reached |
| Phase 3 — System Design | Phase 2 ≥ 50% |
| Phase 4 — Final Prep | Overall progress ≥ 75% |

---

## 9. Task Board (Kanban)

```typescript
// src/controllers/taskController.ts

// GET /api/roadmap/:id/tasks?sort=impact
export async function getTasks(req: Request, res: Response) {
  const { id: roadmapId } = req.params;
  const sort = req.query.sort === "impact" ? { scoreImpact: "desc" } : { createdAt: "asc" };

  const tasks = await prisma.task.findMany({
    where: { roadmapId },
    orderBy: sort,
  });

  const grouped = {
    todo: tasks.filter((t) => t.status === "TODO"),
    in_progress: tasks.filter((t) => t.status === "IN_PROGRESS"),
    done: tasks.filter((t) => t.status === "DONE"),
  };

  return res.json(grouped);
}

// PATCH /api/tasks/:id/status
export async function updateTaskStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body; // "TODO" | "IN_PROGRESS" | "DONE"

  const task = await prisma.task.update({
    where: { id },
    data: { status },
  });

  // Trigger score recalculation
  await recalculateScore(task.roadmapId);

  // Emit update via WebSocket
  io.to(task.roadmapId).emit("task_updated", { taskId: id, status });

  return res.json(task);
}
```

---

## 10. Real-time Sync (LeetCode + WebSocket)

### 10.1 BullMQ Queue Setup

```typescript
// src/queues/lcSyncQueue.ts

import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis";

export const lcSyncQueue = new Queue("lc-sync", { connection: redis });

// Schedule sync for all users with linked LeetCode accounts — every 30 minutes
export async function scheduleAllLcSyncs() {
  const users = await prisma.userProfile.findMany({
    where: { leetcodeUsername: { not: null } },
    select: { userId: true, leetcodeUsername: true },
  });

  for (const user of users) {
    await lcSyncQueue.add(
      "sync-user",
      { userId: user.userId, username: user.leetcodeUsername },
      {
        repeat: { every: 30 * 60 * 1000 }, // 30 minutes
        jobId: `lc-sync-${user.userId}`,   // deduplicate
      }
    );
  }
}
```

### 10.2 LeetCode Sync Worker

```typescript
// src/workers/lcSyncWorker.ts

import { Worker } from "bullmq";
import { redis } from "../lib/redis";

const worker = new Worker(
  "lc-sync",
  async (job) => {
    const { userId, username } = job.data;

    // 1. Fetch recent submissions from LeetCode
    const recentSubs = await fetchRecentSubmissions(username);

    // 2. Get already stored submission IDs for this user
    const stored = await prisma.lcSubmission.findMany({
      where: { userId },
      select: { lcProblemId: true },
    });
    const storedIds = new Set(stored.map((s) => s.lcProblemId));

    // 3. Process only NEW submissions
    const newSubs = recentSubs.filter((s: any) => !storedIds.has(s.id));
    if (!newSubs.length) {
      // Update lastSyncedAt even if no new submissions
      await prisma.userProfile.update({
        where: { userId },
        data: { lastLcSyncAt: new Date() },
      });
      return;
    }

    // 4. Enrich each new submission with tags (cached per problem)
    for (const sub of newSubs) {
      let tags: string[] = [];
      const cacheKey = `lc:problem:${sub.titleSlug}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        tags = JSON.parse(cached);
      } else {
        await new Promise((r) => setTimeout(r, 500)); // rate limit
        const details = await fetchProblemDetails(sub.titleSlug);
        tags = details?.topicTags?.map((t: any) => t.slug) ?? [];
        await redis.set(cacheKey, JSON.stringify(tags)); // permanent cache
      }

      await prisma.lcSubmission.create({
        data: {
          userId,
          lcProblemId: sub.id,
          titleSlug: sub.titleSlug,
          title: sub.title,
          difficulty: "Medium", // fetch from details if needed
          tags,
          solvedAt: new Date(parseInt(sub.timestamp) * 1000),
        },
      });
    }

    // 5. Update skill progress for each roadmap of this user
    const roadmaps = await prisma.roadmap.findMany({ where: { userId } });
    for (const roadmap of roadmaps) {
      await updateSkillProgress(roadmap.id, userId);
      await updateWeekDsaProgress(roadmap.id, newSubs);
      await updateStreak(roadmap.id, userId);
      await updateProblemsThisWeek(roadmap.id, userId);
      await recalculateScore(roadmap.id);

      // 6. Emit WebSocket events
      const updated = await prisma.roadmap.findUnique({ where: { id: roadmap.id } });
      io.to(roadmap.id).emit("score_updated", {
        score: updated?.currentScore,
        overallProgress: updated?.overallProgress,
      });
      io.to(roadmap.id).emit("sync_complete", {
        lastSyncedAt: new Date().toISOString(),
      });
    }

    // 7. Update sync timestamp
    await prisma.userProfile.update({
      where: { userId },
      data: { lastLcSyncAt: new Date() },
    });
  },
  { connection: redis, concurrency: 5 }
);
```

### 10.3 Streak Logic

```typescript
// src/services/streakService.ts
import { startOfDay, subDays, isSameDay } from "date-fns";

export async function updateStreak(roadmapId: string, userId: string): Promise<void> {
  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (!roadmap) return;

  const latestSub = await prisma.lcSubmission.findFirst({
    where: { userId },
    orderBy: { solvedAt: "desc" },
  });
  if (!latestSub) return;

  const today = startOfDay(new Date());
  const solvedDay = startOfDay(latestSub.solvedAt);
  const lastSolvedDay = roadmap.lastSolvedAt ? startOfDay(roadmap.lastSolvedAt) : null;

  let newStreak = roadmap.streakDays;

  if (lastSolvedDay && isSameDay(lastSolvedDay, subDays(today, 1))) {
    // Consecutive day
    newStreak += 1;
  } else if (!lastSolvedDay || !isSameDay(lastSolvedDay, today)) {
    // Not today yet and not yesterday — reset
    newStreak = 1;
  }

  await prisma.roadmap.update({
    where: { id: roadmapId },
    data: { streakDays: newStreak, lastSolvedAt: latestSub.solvedAt },
  });

  io.to(roadmapId).emit("streak_updated", {
    streak: newStreak,
    lastSolvedAt: latestSub.solvedAt,
  });
}
```

### 10.4 WebSocket Setup (Server)

```typescript
// src/lib/socket.ts

import { Server } from "socket.io";
import { verifyToken } from "./auth";

export function setupSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const user = verifyToken(token);
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // Client joins a room per roadmap
    socket.on("join_roadmap", async (roadmapId: string) => {
      // Verify user owns this roadmap
      const roadmap = await prisma.roadmap.findFirst({
        where: { id: roadmapId, userId: socket.data.userId },
      });
      if (roadmap) socket.join(roadmapId);
    });

    socket.on("ping", () => socket.emit("pong"));
    socket.on("disconnect", () => {});
  });

  return io;
}
```

---

## 11. Frontend Architecture

### 11.1 Page Component Tree

```
app/roadmap/[company]/page.tsx
  └── RoadmapPage
        ├── RoadmapHeader
        │     ├── Title ("My Google Roadmap"), subtitle ("L3 SWE · 24 week plan")
        │     ├── LastSynced (polls/listens for sync_complete event)
        │     ├── RegenerateButton → POST /api/roadmap/:id/regenerate
        │     └── ExportButton → GET /api/roadmap/:id/export
        ├── StatsRow
        │     ├── CurrentScoreCard (roadmap.currentScore)
        │     ├── TargetCard (roadmap.targetScore)
        │     ├── TimeCard (roadmap.totalWeeks)
        │     └── ProgressCard (roadmap.overallProgress)
        ├── StreakBar
        │     ├── StreakDays (roadmap.streakDays)
        │     ├── LastSolved (roadmap.lastSolvedAt)
        │     └── ProblemsThisWeek (roadmap.problemsThisWeek)
        ├── OverallProgressBar (roadmap.overallProgress)
        ├── LearningPhases
        │     └── PhaseCard[] × 4 (from /phases endpoint)
        ├── WeeklyPlan
        │     ├── WeekTabStrip (W1–W24, active = roadmap.currentWeek)
        │     └── WeekDetail (fetched on tab click)
        │           ├── WeekHeader (title, hours/day, progress)
        │           ├── DsaTaskRow (label, count badge, status)
        │           ├── DailyPlanTable (Mon–Sun grid)
        │           ├── ResourceList
        │           └── ProjectTaskRow + CompleteWeekButton
        ├── ScoreImpactSimulator (pure client state)
        ├── TaskBoard (kanban — /tasks endpoint)
        └── ProgressAnalytics
              ├── TimeRangeToggle (1M / 3M / 6M / 1Y)
              ├── MatchScoreChart (Recharts LineChart — /score-history)
              ├── ProblemsPerWeekChart (BarChart — /problems-per-week)
              └── SkillProgressList (/skill-progress)
```

### 11.2 React Query Setup

```typescript
// src/hooks/useRoadmap.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useRoadmap(company: string) {
  return useQuery({
    queryKey: ["roadmap", company],
    queryFn: () => api.get(`/roadmap/${company}`).then((r) => r.data),
    staleTime: 60_000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

export function usePhases(roadmapId: string) {
  return useQuery({
    queryKey: ["phases", roadmapId],
    queryFn: () => api.get(`/roadmap/${roadmapId}/phases`).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!roadmapId,
  });
}

export function useWeek(roadmapId: string, weekNumber: number) {
  return useQuery({
    queryKey: ["week", roadmapId, weekNumber],
    queryFn: () => api.get(`/roadmap/${roadmapId}/week/${weekNumber}`).then((r) => r.data),
    staleTime: 30_000,
    enabled: !!roadmapId && weekNumber > 0,
  });
}

export function useTasks(roadmapId: string) {
  return useQuery({
    queryKey: ["tasks", roadmapId],
    queryFn: () => api.get(`/roadmap/${roadmapId}/tasks?sort=impact`).then((r) => r.data),
    staleTime: 30_000,
    enabled: !!roadmapId,
  });
}

export function useScoreHistory(roadmapId: string, range: "1M" | "3M" | "6M" | "1Y") {
  return useQuery({
    queryKey: ["score-history", roadmapId, range],
    queryFn: () => api.get(`/roadmap/${roadmapId}/score-history?range=${range}`).then((r) => r.data),
    staleTime: 5 * 60_000, // 5 minutes
    enabled: !!roadmapId,
  });
}
```

### 11.3 WebSocket Hook (Frontend)

```typescript
// src/hooks/useRoadmapSocket.ts

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner"; // or any toast library

let socket: Socket | null = null;

export function useRoadmapSocket(roadmapId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roadmapId) return;

    socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token: localStorage.getItem("access_token") },
    });

    socket.emit("join_roadmap", roadmapId);

    socket.on("score_updated", (data) => {
      queryClient.setQueryData(["roadmap"], (old: any) =>
        old ? { ...old, currentScore: data.score, overallProgress: data.overallProgress } : old
      );
    });

    socket.on("phase_unlocked", (data) => {
      queryClient.invalidateQueries({ queryKey: ["phases", roadmapId] });
      toast.success(`Phase ${data.phaseNumber} unlocked: ${data.title}!`);
    });

    socket.on("task_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", roadmapId] });
    });

    socket.on("streak_updated", (data) => {
      queryClient.setQueryData(["roadmap"], (old: any) =>
        old ? { ...old, streakDays: data.streak, lastSolvedAt: data.lastSolvedAt } : old
      );
    });

    socket.on("sync_complete", (data) => {
      queryClient.setQueryData(["roadmap"], (old: any) =>
        old ? { ...old, lastSyncedAt: data.lastSyncedAt } : old
      );
      // Refresh week data too
      queryClient.invalidateQueries({ queryKey: ["week", roadmapId] });
    });

    // Ping every 25 seconds to keep connection alive
    const ping = setInterval(() => socket?.emit("ping"), 25_000);

    return () => {
      clearInterval(ping);
      socket?.disconnect();
      socket = null;
    };
  }, [roadmapId, queryClient]);
}
```

### 11.4 Zustand Store (Local UI State Only)

```typescript
// src/store/roadmapUiStore.ts

import { create } from "zustand";

interface RoadmapUiState {
  activeWeek: number;
  setActiveWeek: (week: number) => void;

  analyticsRange: "1M" | "3M" | "6M" | "1Y";
  setAnalyticsRange: (range: "1M" | "3M" | "6M" | "1Y") => void;

  simulatorSelected: string[];
  toggleSimulatorItem: (item: string) => void;
}

export const useRoadmapUiStore = create<RoadmapUiState>((set) => ({
  activeWeek: 2,
  setActiveWeek: (week) => set({ activeWeek: week }),

  analyticsRange: "3M",
  setAnalyticsRange: (range) => set({ analyticsRange: range }),

  simulatorSelected: [],
  toggleSimulatorItem: (item) =>
    set((state) => ({
      simulatorSelected: state.simulatorSelected.includes(item)
        ? state.simulatorSelected.filter((i) => i !== item)
        : [...state.simulatorSelected, item],
    })),
}));
```

---

## 12. API Endpoints Reference

### Base URL: `/api`
### Auth: All endpoints require `Authorization: Bearer <access_token>` header

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/roadmap/generate` | Generate a new roadmap (triggers AI pipeline) |
| `GET` | `/roadmap/:company` | Get full roadmap header + stats |
| `POST` | `/roadmap/:id/regenerate` | Clear cache and regenerate |
| `GET` | `/roadmap/:id/export` | Download PDF export |
| `GET` | `/roadmap/:id/phases` | Get all 4 phases with status and progress |
| `GET` | `/roadmap/:id/week/:n` | Get full week detail |
| `PATCH` | `/roadmap/:id/week/:n/complete` | Manually mark a week as done |
| `GET` | `/roadmap/:id/tasks` | Get all tasks (`?sort=impact\|status`) |
| `PATCH` | `/tasks/:id/status` | Update task status |
| `GET` | `/roadmap/:id/score-history` | Score time series (`?range=1M\|3M\|6M\|1Y`) |
| `GET` | `/roadmap/:id/skill-progress` | Per-topic LeetCode progress |
| `GET` | `/roadmap/:id/problems-per-week` | Weekly problem counts for bar chart |
| `POST` | `/integrations/leetcode/sync` | Force immediate LeetCode sync |
| `POST` | `/coach/chat` | Streaming AI coach response |

### Example Responses

**GET /roadmap/google**
```json
{
  "id": "uuid",
  "targetCompany": "google",
  "targetLevel": "L3 SWE",
  "totalWeeks": 24,
  "targetScore": 85,
  "currentScore": 0,
  "overallProgress": 0,
  "streakDays": 0,
  "lastSolvedAt": null,
  "problemsThisWeek": 0,
  "currentWeek": 2,
  "lastSyncedAt": "2026-03-27T07:52:00Z",
  "generatedAt": "2026-03-27T07:00:00Z"
}
```

**GET /roadmap/:id/phases**
```json
[
  {
    "id": "uuid",
    "phaseNumber": 1,
    "title": "DSA Foundation",
    "weekStart": 1,
    "weekEnd": 5,
    "status": "UNLOCKED",
    "progress": 0
  },
  {
    "id": "uuid",
    "phaseNumber": 2,
    "title": "Projects & Stack",
    "weekStart": 6,
    "weekEnd": 8,
    "status": "LOCKED",
    "progress": 0
  }
]
```

---

## 13. Ask Coach (AI Chat)

```typescript
// src/controllers/coachController.ts

export async function coachChat(req: Request, res: Response) {
  const { message, roadmapId, conversationHistory } = req.body;

  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: { phases: true, skillProgress: true },
  });

  const systemPrompt = `You are an expert interview coach for ${roadmap?.targetCompany} ${roadmap?.targetLevel}.
The user is on week ${roadmap?.currentWeek} of their ${roadmap?.totalWeeks}-week preparation plan.
Current match score: ${roadmap?.currentScore?.toFixed(1)}% (target: ${roadmap?.targetScore}%).
Weakest skills: ${roadmap?.skillProgress
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 3)
    .map((s) => s.topic)
    .join(", ")}.
Be concise, specific, and actionable. Reference their actual progress when relevant.`;

  // Stream the response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      ...(conversationHistory ?? []),
      { role: "user", content: message },
    ],
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
}
```

---

## 14. Score Impact Simulator

This is entirely client-side — no server call needed.

```typescript
// src/components/ScoreImpactSimulator.tsx

const SIMULATOR_ITEMS = [
  { id: "dsa", label: "Master DSA", impact: 8 },
  { id: "projects", label: "Build Projects", impact: 3 },
  { id: "systemDesign", label: "System Design", impact: 3 },
  { id: "stack", label: "Align Tech Stack", impact: 2 },
  { id: "experience", label: "Get Experience", impact: 2 },
  { id: "consistency", label: "Build Consistency", impact: 1 },
];

export function ScoreImpactSimulator({ currentScore, targetScore }: Props) {
  const { simulatorSelected, toggleSimulatorItem } = useRoadmapUiStore();

  const projectedScore = useMemo(() => {
    let score = currentScore;
    for (const id of simulatorSelected) {
      const item = SIMULATOR_ITEMS.find((i) => i.id === id);
      if (item) score += item.impact;
    }
    return Math.min(score, 100);
  }, [currentScore, simulatorSelected]);

  const gap = Math.max(targetScore - projectedScore, 0);

  return (
    <div>
      <div>
        {SIMULATOR_ITEMS.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={simulatorSelected.includes(item.id)}
              onChange={() => toggleSimulatorItem(item.id)}
            />
            {item.label}
            <span>+{item.impact}%</span>
          </label>
        ))}
      </div>
      <div>
        <p>Current Score: {currentScore.toFixed(0)}%</p>
        <p>Projected Score: {projectedScore.toFixed(0)}%</p>
        <p>Gap to target ({targetScore}%): {gap.toFixed(0)}% remaining</p>
      </div>
    </div>
  );
}
```

---

## 15. Progress Analytics

### Score History Endpoint

```typescript
// src/controllers/analyticsController.ts

export async function getScoreHistory(req: Request, res: Response) {
  const { id: roadmapId } = req.params;
  const range = (req.query.range as string) ?? "3M";

  const rangeMap: Record<string, number> = { "1M": 4, "3M": 12, "6M": 24, "1Y": 52 };
  const weeksBack = rangeMap[range] ?? 12;

  const snapshots = await prisma.scoreSnapshot.findMany({
    where: { roadmapId },
    orderBy: { weekNumber: "asc" },
    take: weeksBack,
  });

  return res.json(snapshots);
}

export async function getProblemsPerWeek(req: Request, res: Response) {
  const { id: roadmapId } = req.params;
  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (!roadmap) return res.status(404).json({ error: "Not found" });

  const submissions = await prisma.lcSubmission.findMany({
    where: { userId: roadmap.userId },
    select: { solvedAt: true },
  });

  // Group by week number relative to roadmap start
  const weekCounts: Record<number, number> = {};
  const roadmapStart = roadmap.createdAt;
  for (const sub of submissions) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weekNum = Math.floor((sub.solvedAt.getTime() - roadmapStart.getTime()) / msPerWeek) + 1;
    if (weekNum > 0 && weekNum <= roadmap.totalWeeks) {
      weekCounts[weekNum] = (weekCounts[weekNum] ?? 0) + 1;
    }
  }

  return res.json(weekCounts);
}
```

---

## 16. Caching Strategy

| Data | Cache | TTL | Key Pattern |
|------|-------|-----|-------------|
| AI roadmap generation output | Redis | 7 days | `roadmap:gen:{hash}` |
| LeetCode problem tags | Redis | Permanent | `lc:problem:{titleSlug}` |
| LeetCode user profile | Redis | 30 min | `lc:profile:{username}` |
| GitHub repos | Redis | 1 hour | `gh:repos:{username}` |
| Week detail (React Query) | Client | 30 sec | `['week', roadmapId, n]` |
| Roadmap header (React Query) | Client | 60 sec | `['roadmap', company]` |
| Score history (React Query) | Client | 5 min | `['score-history', id, range]` |

---

## 17. Environment Variables

```bash
# .env

# Database
DATABASE_URL="postgresql://user:password@host:5432/roadmap_db"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="30d"

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# GitHub Integration
GITHUB_PAT="ghp_..."

# Frontend
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Misc
NODE_ENV="development"
PORT=4000
```

---

## Notes for Antigravity

1. **Start with the DB schema** — run `prisma migrate dev` first, then build the generation pipeline.
2. **LeetCode GraphQL is unofficial** — it works but can change. Build with retries and graceful degradation (if LC is down, sync silently fails and retries on next cron tick).
3. **The AI generation is the slowest step** (~3–8 seconds). Show a loading skeleton on the frontend while it runs. Consider running it as a background job and polling for completion.
4. **The `generation_hash` cache is critical** — same user + same gap profile should not call Claude twice. This saves cost and improves speed significantly.
5. **Week progression** — decide whether `currentWeek` advances automatically by calendar (Monday = new week) or by task completion. The simplest implementation is calendar-based: advance currentWeek every Monday via a cron job.
6. **Phase progress** is calculated as: `(completed tasks within this phase's week range) / (total tasks within this phase's week range) * 100`.
7. **The score is intentionally 0% at start** — this is correct UX, it represents "no progress yet" and gamifies the journey.
8. **Socket rooms** use `roadmapId` as the room name. A user joins the room on page load and leaves on unmount. This means only users actively viewing their roadmap receive real-time events — not a broadcast to all users.
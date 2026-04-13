# Orchestrator — 2-phase execution: parallel (1-5) → sequential (6→7→8)
import logging
import asyncio
from datetime import datetime

from agents.core.models import (
    UserAnalysisRequest,
    CompleteAnalysis,
    GitHubAnalysis,
    DSAAnalysis,
    ResumeData,
    TrendData,
    CompanyBlueprintModel,
    GapAnalysis,
)

logger = logging.getLogger(__name__)


class MintKeyOrchestrator:
    """
    Master controller — runs all 8 agents in a 2-phase execution pattern.

    Phase 1 (Parallel): Agents 1-5 via asyncio.gather(return_exceptions=True)
    Phase 2 (Sequential): Agent 6 (needs 1,2,5) → Agent 7 (needs 6) → Agent 8 (needs all)
    """

    async def run_full_analysis(
        self, request: UserAnalysisRequest, progress_callback=None
    ) -> CompleteAnalysis:
        """Execute the complete 8-agent analysis pipeline."""
        logger.info(f"[Orchestrator] Starting full analysis for user {request.user_id}")

        result = CompleteAnalysis(
            user_id=request.user_id,
            analysis_timestamp=datetime.utcnow().isoformat(),
        )

        # =============================================
        # PHASE 1: Sequential with small delays (Groq free tier = 12K TPM)
        # Running agents one-by-one avoids rate limit exhaustion
        # =============================================
        if progress_callback:
            await progress_callback("phase1_start", "Starting Phase 1: Agent analysis")

        # Run each agent sequentially with short cooldown between calls
        agent_results = []
        agent_runners = [
            self._run_agent_1(request, progress_callback),
            self._run_agent_2(request, progress_callback),
            self._run_agent_3(request, progress_callback),
            self._run_agent_4(request, progress_callback),
            self._run_agent_5(request, progress_callback),
        ]

        for i, coro in enumerate(agent_runners):
            try:
                r = await coro
                agent_results.append(r)
            except Exception as e:
                logger.error(f"[Orchestrator] Agent {i+1} failed: {e}")
                agent_results.append(e)
            if i < len(agent_runners) - 1:
                await asyncio.sleep(8)  # 8s between agents — allows Groq 12K TPM to reset

        phase1_results = agent_results

        # Assign results (default to empty on failure)
        result.github_analysis = phase1_results[0] if not isinstance(phase1_results[0], Exception) else GitHubAnalysis()
        result.dsa_analysis = phase1_results[1] if not isinstance(phase1_results[1], Exception) else DSAAnalysis()
        result.resume_data = phase1_results[2] if not isinstance(phase1_results[2], Exception) else ResumeData()
        result.trend_data = phase1_results[3] if not isinstance(phase1_results[3], Exception) else TrendData()

        # Agent 5 returns blueprints for each company
        if not isinstance(phase1_results[4], Exception):
            blueprints = phase1_results[4]
            if isinstance(blueprints, dict):
                result.company_blueprints = blueprints
            elif isinstance(blueprints, CompanyBlueprintModel):
                result.company_blueprints = {blueprints.company_slug: blueprints}
        else:
            logger.error(f"[Orchestrator] Agent 5 failed: {phase1_results[4]}")

        # =============================================
        # FALLBACK: Enrich zero-score outputs with raw scraped data
        # LLM JSON parsing can fail — use deterministic scoring as safety net
        # =============================================
        await self._enrich_with_raw_data(request, result)

        # Log phase 1 completion
        failures = [i+1 for i, r in enumerate(phase1_results) if isinstance(r, Exception)]
        if failures:
            logger.warning(f"[Orchestrator] Phase 1 agents failed: {failures}")
        logger.info("[Orchestrator] Phase 1 complete")

        if progress_callback:
            await progress_callback("phase1_done", f"Phase 1 complete. {5-len(failures)}/5 agents succeeded")

        # =============================================
        # PHASE 2: Sequential — Agents 6, 7, 8
        # Add delays between agents to respect rate limits
        # =============================================
        if progress_callback:
            await progress_callback("phase2_start", "Starting Phase 2: Sequential agent analysis")

        # Merge user skills from all sources
        user_skills = self._merge_user_skills(result)

        # Enrich blueprints with required_skills from DB if agent returned empty
        for company_slug, bp in result.company_blueprints.items():
            if not bp.required_skills:
                try:
                    from app.core.database import async_session_factory
                    from app.models.db import CompanyBlueprint
                    from sqlalchemy import select

                    async with async_session_factory() as session:
                        r = await session.execute(
                            select(CompanyBlueprint).where(CompanyBlueprint.slug == company_slug)
                        )
                        db_bp = r.scalar_one_or_none()
                        if db_bp:
                            # Extract required skills from tech_stack JSONB
                            tech = db_bp.tech_stack or {}
                            skills = set()
                            if isinstance(tech, dict):
                                for k, v in tech.items():
                                    if isinstance(v, list):
                                        skills.update(v)
                                    elif isinstance(v, str):
                                        skills.add(v)
                            elif isinstance(tech, list):
                                skills.update(tech)
                            # Also add DSA topics from dsa_requirements
                            dsa_req = db_bp.dsa_requirements or {}
                            if isinstance(dsa_req, dict):
                                for topic_list in dsa_req.values():
                                    if isinstance(topic_list, list):
                                        for item in topic_list:
                                            if isinstance(item, str):
                                                skills.add(item)
                                            elif isinstance(item, dict):
                                                skills.add(item.get("topic", item.get("name", "")))
                            bp.required_skills = [s for s in skills if s][:25]
                            logger.info(f"Enriched {company_slug} required_skills from DB: {len(bp.required_skills)} skills")
                except Exception as e:
                    logger.error(f"Failed to enrich blueprint for {company_slug}: {e}")

        # Short pause before Phase 2 — agents are already sequential so TPM is spread
        await asyncio.sleep(3)

        # Agent 6: Gap Finder (needs Agents 1, 2, 5)
        try:
            if progress_callback:
                await progress_callback("agent6_start", "Agent 6: Analyzing skill gaps")

            from agents.gap_finder import run_gap_finder

            # For each target company
            primary_company = request.target_companies[0] if request.target_companies else "general"
            blueprint = result.company_blueprints.get(primary_company, CompanyBlueprintModel())
            required_skills = blueprint.required_skills

            result.gap_analysis = await run_gap_finder(
                user_skills=user_skills,
                required_skills=required_skills,
                company_name=primary_company,
            )
        except Exception as e:
            logger.error(f"[Orchestrator] Agent 6 failed: {e}")
            result.gap_analysis = GapAnalysis(recommendations=[f"Gap analysis failed: {str(e)}"])

        # =============================================
        # AGENTS 7 & 8 removed from main pipeline
        # Roadmap Builder → triggered on-demand per company via /api/v1/roadmap/{slug}/generate
        # Career Coach    → triggered on-demand via /api/v1/coach/generate
        # This reduces LLM calls from ~10+ to ~6, avoiding TPM rate limits
        # =============================================

        if progress_callback:
            await progress_callback("complete", "Analysis complete!")

        logger.info("[Orchestrator] Full analysis complete")
        return result

    # --- Phase 1 Agent Runners ---

    async def _run_agent_1(self, request: UserAnalysisRequest, progress_callback) -> GitHubAnalysis:
        """Run GitHub Intelligence Analyst."""
        if not request.github_username:
            return GitHubAnalysis(recommendations=["No GitHub username provided"])

        if progress_callback:
            await progress_callback("agent1_start", "Agent 1: Analyzing GitHub profile")

        from agents.github_analyst import run_github_analyst
        return await run_github_analyst(request.github_username)

    async def _run_agent_2(self, request: UserAnalysisRequest, progress_callback) -> DSAAnalysis:
        """Run DSA Performance Analyst."""
        if not request.leetcode_username:
            return DSAAnalysis(recommendations=["No LeetCode username provided"])

        if progress_callback:
            await progress_callback("agent2_start", "Agent 2: Analyzing LeetCode performance")

        # Fetch LeetCode data first
        from scrapers.leetcode_scraper import LeetCodeScraper
        scraper = LeetCodeScraper()
        lc_data = await scraper.fetch_full_stats(request.leetcode_username)

        from agents.dsa_analyst import run_dsa_analyst
        return await run_dsa_analyst(lc_data)

    async def _run_agent_3(self, request: UserAnalysisRequest, progress_callback) -> ResumeData:
        """Run Resume Intelligence Parser."""
        if not request.resume_text:
            return ResumeData(recommendations=["No resume provided"])

        if progress_callback:
            await progress_callback("agent3_start", "Agent 3: Parsing resume")

        from agents.resume_parser import run_resume_parser
        return await run_resume_parser({"raw_text": request.resume_text})

    async def _run_agent_4(self, request: UserAnalysisRequest, progress_callback) -> TrendData:
        """Run Market Trend Watcher."""
        company = request.target_companies[0] if request.target_companies else "tech industry"

        if progress_callback:
            await progress_callback("agent4_start", "Agent 4: Analyzing market trends")

        from agents.trend_watcher import run_trend_watcher
        return await run_trend_watcher(company, [])

    async def _run_agent_5(self, request: UserAnalysisRequest, progress_callback):
        """Run Company Blueprint Expert for each target company."""
        if not request.target_companies:
            return {}

        if progress_callback:
            await progress_callback("agent5_start", "Agent 5: Building company blueprints")

        from agents.company_expert import run_company_expert

        blueprints = {}
        for company in request.target_companies[:5]:  # Max 5 companies
            blueprint = await run_company_expert(company)
            blueprints[blueprint.company_slug or company.lower()] = blueprint

        return blueprints

    # --- Utility Methods ---

    def _merge_user_skills(self, result: CompleteAnalysis) -> list[str]:
        """Merge skills from GitHub, resume, and LeetCode into a unified list."""
        skills = set()

        if result.github_analysis:
            skills.update(result.github_analysis.technology_stack)

        if result.resume_data:
            skills.update(result.resume_data.extracted_skills)

        return list(skills)

    async def _enrich_with_raw_data(
        self, request: UserAnalysisRequest, result: CompleteAnalysis
    ) -> None:
        """
        Safety net: if LLM agents returned zero-score defaults,
        enrich with deterministic scores computed from raw scraped data.
        This ensures the scoring engine always has real numbers.
        """
        # --- Enrich DSA (Agent 2) ---
        if result.dsa_analysis and result.dsa_analysis.total_solved == 0 and request.leetcode_username:
            try:
                from scrapers.leetcode_scraper import LeetCodeScraper
                scraper = LeetCodeScraper()
                lc = await scraper.fetch_full_stats(request.leetcode_username)
                summary = lc.get("summary", {})
                total = summary.get("total_solved", 0)

                if total > 0:
                    easy = summary.get("easy", 0)
                    medium = summary.get("medium", 0)
                    hard = summary.get("hard", 0)

                    # Deterministic DSA score (same thresholds as scoring.py)
                    if total >= 400:
                        depth = 90
                    elif total >= 300:
                        depth = 75
                    elif total >= 200:
                        depth = 60
                    elif total >= 100:
                        depth = 45
                    elif total >= 50:
                        depth = 35
                    else:
                        depth = max(total * 0.5, 5)

                    # Bonus for difficulty balance
                    if hard >= 10:
                        depth = min(depth + 5, 100)
                    if medium >= total * 0.4:
                        depth = min(depth + 3, 100)

                    # Build topic map from scraper data
                    topics = {}
                    for t in lc.get("topic_breakdown", []):
                        tag = t.get("tag", "")
                        solved = t.get("solved", 0)
                        if solved >= 15:
                            topics[tag] = "strong"
                        elif solved >= 5:
                            topics[tag] = "medium"
                        else:
                            topics[tag] = "weak"

                    result.dsa_analysis.total_solved = total
                    result.dsa_analysis.dsa_depth_score = round(depth, 1)
                    result.dsa_analysis.difficulty_distribution = {
                        "Easy": easy, "Medium": medium, "Hard": hard
                    }
                    result.dsa_analysis.easy_reliance_flag = (
                        easy / total > 0.6 if total > 0 else False
                    )
                    result.dsa_analysis.topic_weakness_map = topics

                    logger.info(
                        f"[Orchestrator] Enriched DSA: total={total}, depth={depth}"
                    )
            except Exception as e:
                logger.error(f"[Orchestrator] DSA enrichment failed: {e}")

        # --- Enrich GitHub (Agent 1) ---
        if result.github_analysis and result.github_analysis.project_depth_score == 0 and request.github_username:
            try:
                from scrapers.github_scraper import GitHubScraper
                gh = GitHubScraper()
                repos = await gh.fetch_repos(request.github_username)
                original_repos = [r for r in repos if not r.get("fork", False)]

                if original_repos:
                    # Count languages
                    langs = {}
                    tech_stack = set()
                    for repo in original_repos:
                        lang = repo.get("language")
                        if lang:
                            langs[lang] = langs.get(lang, 0) + 1
                            tech_stack.add(lang)

                    # Compute project depth score
                    repo_count = len(original_repos)
                    lang_diversity = len(langs)
                    has_readme = sum(
                        1 for r in original_repos
                        if r.get("description") and len(r.get("description", "")) > 20
                    )
                    total_stars = sum(r.get("stargazers_count", 0) for r in original_repos)

                    # Score based on portfolio strength
                    depth = 20  # Baseline for having a GitHub
                    depth += min(repo_count * 4, 30)  # Up to 30 for repo count
                    depth += min(lang_diversity * 5, 20)  # Up to 20 for lang diversity
                    depth += min(has_readme * 3, 15)  # Up to 15 for descriptions
                    depth += min(total_stars * 2, 15)  # Up to 15 for stars
                    depth = min(depth, 100)

                    # Maturity index
                    maturity = 20
                    maturity += min(repo_count * 3, 25)
                    maturity += min(lang_diversity * 5, 25)
                    maturity += min(total_stars * 3, 30)
                    maturity = min(maturity, 100)

                    # Language distribution
                    total_lang = sum(langs.values())
                    lang_dist = {
                        k: round(v / total_lang * 100, 1)
                        for k, v in sorted(langs.items(), key=lambda x: -x[1])
                    }

                    # Top projects
                    top = sorted(original_repos, key=lambda r: r.get("stargazers_count", 0), reverse=True)[:5]
                    top_projects = [
                        {
                            "name": r.get("name"),
                            "language": r.get("language"),
                            "description": r.get("description", ""),
                            "stars": r.get("stargazers_count", 0),
                        }
                        for r in top
                    ]

                    result.github_analysis.project_depth_score = depth
                    result.github_analysis.engineering_maturity_index = maturity
                    result.github_analysis.language_distribution = lang_dist
                    result.github_analysis.technology_stack = list(tech_stack)
                    result.github_analysis.top_projects = top_projects

                    logger.info(
                        f"[Orchestrator] Enriched GitHub: depth={depth}, "
                        f"maturity={maturity}, repos={repo_count}, langs={list(tech_stack)}"
                    )
            except Exception as e:
                logger.error(f"[Orchestrator] GitHub enrichment failed: {e}")

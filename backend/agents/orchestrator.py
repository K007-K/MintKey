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
    CoachingReport,
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
        # PHASE 1: Parallel — Agents 1, 2, 3, 4, 5
        # =============================================
        if progress_callback:
            await progress_callback("phase1_start", "Starting Phase 1: Parallel agent analysis")

        phase1_results = await asyncio.gather(
            self._run_agent_1(request, progress_callback),
            self._run_agent_2(request, progress_callback),
            self._run_agent_3(request, progress_callback),
            self._run_agent_4(request, progress_callback),
            self._run_agent_5(request, progress_callback),
            return_exceptions=True,
        )

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

        # Log phase 1 completion
        failures = [i+1 for i, r in enumerate(phase1_results) if isinstance(r, Exception)]
        if failures:
            logger.warning(f"[Orchestrator] Phase 1 agents failed: {failures}")
        logger.info("[Orchestrator] Phase 1 complete")

        if progress_callback:
            await progress_callback("phase1_done", f"Phase 1 complete. {5-len(failures)}/5 agents succeeded")

        # =============================================
        # PHASE 2: Sequential — Agents 6, 7, 8
        # =============================================
        if progress_callback:
            await progress_callback("phase2_start", "Starting Phase 2: Sequential agent analysis")

        # Merge user skills from all sources
        user_skills = self._merge_user_skills(result)

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

        # Agent 7: Roadmap Builder (needs Agents 2, 5, 6)
        try:
            if progress_callback:
                await progress_callback("agent7_start", "Agent 7: Building preparation roadmap")

            from agents.roadmap_builder import run_roadmap_builder

            for company_slug in request.target_companies[:3]:  # Max 3 companies
                blueprint = result.company_blueprints.get(company_slug, CompanyBlueprintModel())
                roadmap = await run_roadmap_builder(
                    gap_analysis=result.gap_analysis.model_dump() if result.gap_analysis else {},
                    dsa_analysis=result.dsa_analysis.model_dump() if result.dsa_analysis else {},
                    company_blueprint=blueprint.model_dump(),
                    months_available=request.months_available,
                    hours_per_day=request.hours_per_day,
                )
                result.roadmaps[company_slug] = roadmap
        except Exception as e:
            logger.error(f"[Orchestrator] Agent 7 failed: {e}")

        # Agent 8: Career Coach (needs all agent outputs)
        try:
            if progress_callback:
                await progress_callback("agent8_start", "Agent 8: Generating coaching report")

            from agents.career_coach import run_career_coach

            coaching_input = {
                "github": result.github_analysis.model_dump() if result.github_analysis else {},
                "dsa": result.dsa_analysis.model_dump() if result.dsa_analysis else {},
                "resume": result.resume_data.model_dump() if result.resume_data else {},
                "trends": result.trend_data.model_dump() if result.trend_data else {},
                "blueprints": {k: v.model_dump() for k, v in result.company_blueprints.items()},
                "gaps": result.gap_analysis.model_dump() if result.gap_analysis else {},
                "roadmaps": {k: v.model_dump() for k, v in result.roadmaps.items()},
            }

            result.coaching = await run_career_coach(coaching_input)
        except Exception as e:
            logger.error(f"[Orchestrator] Agent 8 failed: {e}")
            result.coaching = CoachingReport(
                coaching_message=f"Coaching generation failed: {str(e)}",
            )

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

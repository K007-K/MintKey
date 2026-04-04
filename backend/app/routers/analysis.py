# Analysis endpoints — triggers 8-agent analysis, WebSocket progress
import logging
import json
import uuid
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
import asyncio
from pydantic import BaseModel
from typing import Optional

from app.core.redis import redis_client
from app.middleware.auth import get_current_user
from app.models.db import User
from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


def _level_to_float(level: str) -> float:
    """Convert skill level string to numeric value for DB storage."""
    mapping = {
        "none": 0.0, "beginner": 1.0, "basic": 2.0,
        "intermediate": 3.0, "advanced": 4.0, "expert": 5.0,
        "strong": 4.0, "medium": 3.0, "weak": 1.0,
    }
    if isinstance(level, (int, float)):
        return float(level)
    return mapping.get(str(level).lower().strip(), 0.0)


class AnalysisRequest(BaseModel):
    """Request to trigger a full analysis."""
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    resume_text: Optional[str] = None
    target_companies: list[str] = []
    months_available: int = 6
    hours_per_day: float = 4.0


@router.post("/trigger", response_model=APIResponse)
async def trigger_analysis(
    payload: AnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Trigger a full 8-agent analysis.
    Returns a task_id to track progress via WebSocket.
    """
    task_id = str(uuid.uuid4())

    # Store task status in Redis
    try:
        await redis_client.set(
            f"analysis:{task_id}",
            json.dumps({
                "status": "queued",
                "user_id": str(current_user.id),
                "progress": [],
            }),
            ex=3600,
        )
    except Exception as e:
        logger.warning(f"Redis set failed: {e}")

    # Run analysis in background
    import asyncio

    async def _run():
        from agents.orchestrator import MintKeyOrchestrator
        from agents.core.models import UserAnalysisRequest

        # Load the user's linked data from DB for fallback values
        from app.core.database import async_session_factory
        from app.models.db import User as UserModel
        from sqlalchemy import select

        db_github = payload.github_username
        db_leetcode = payload.leetcode_username
        db_resume_text = payload.resume_text
        db_cgpa = None

        try:
            async with async_session_factory() as session:
                result = await session.execute(
                    select(UserModel).where(UserModel.id == current_user.id)
                )
                db_user = result.scalar_one_or_none()
                if db_user:
                    db_github = db_github or db_user.github_username
                    db_leetcode = db_leetcode or db_user.leetcode_username
                    db_cgpa = db_user.cgpa

                    # Extract resume text from parsed data if not provided
                    if not db_resume_text and db_user.resume_parsed_data:
                        parsed = db_user.resume_parsed_data
                        if isinstance(parsed, dict):
                            db_resume_text = parsed.get("raw_text") or parsed.get("text") or json.dumps(parsed)
                        elif isinstance(parsed, str):
                            db_resume_text = parsed

                    logger.info(f"[Analysis] Loaded user data: github={db_github}, leetcode={db_leetcode}, resume={'YES' if db_resume_text else 'NO'}, cgpa={db_cgpa}")
        except Exception as e:
            logger.error(f"[Analysis] Failed to load user data from DB: {e}")

        orchestrator = MintKeyOrchestrator()
        request = UserAnalysisRequest(
            user_id=str(current_user.id),
            github_username=db_github,
            leetcode_username=db_leetcode,
            resume_text=db_resume_text,
            target_companies=payload.target_companies,
            months_available=payload.months_available,
            hours_per_day=payload.hours_per_day,
        )

        async def progress_cb(event: str, message: str):
            try:
                await redis_client.rpush(f"analysis:progress:{task_id}", json.dumps({
                    "event": event,
                    "message": message,
                }))
            except Exception:
                pass

        try:
            result = await orchestrator.run_full_analysis(request, progress_callback=progress_cb)

            # Store result
            try:
                await redis_client.set(
                    f"analysis:{task_id}",
                    json.dumps({
                        "status": "complete",
                        "result": result.model_dump(),
                    }),
                    ex=3600,
                )
            except Exception:
                pass

            # Save to DB
            try:
                from app.core.database import async_session_factory
                from app.models.db import AnalysisResult
                from datetime import datetime

                result_dict = result.model_dump()

                async with async_session_factory() as session:
                    analysis = AnalysisResult(
                        user_id=current_user.id,
                        status="completed",
                        merged_analysis=result_dict,
                        agent_outputs={
                            "github_analysis": result_dict.get("github_analysis"),
                            "dsa_analysis": result_dict.get("dsa_analysis"),
                            "resume_data": result_dict.get("resume_data"),
                            "trend_data": result_dict.get("trend_data"),
                            "company_blueprints": result_dict.get("company_blueprints"),
                            "gap_analysis": result_dict.get("gap_analysis"),
                            "roadmaps": result_dict.get("roadmaps"),
                        },
                        coaching_message=(
                            result_dict.get("coaching", {}).get("coaching_message", "")
                            if result_dict.get("coaching") else None
                        ),
                        completed_at=datetime.utcnow(),
                    )
                    session.add(analysis)
                    await session.commit()
                    logger.info(f"Analysis saved to DB for user {current_user.id}")
            except Exception as e:
                logger.error(f"Failed to save analysis: {e}")
                import traceback
                traceback.print_exc()

            # Roadmaps are now generated on-demand when user visits a company page
            # See: /api/v1/roadmap/{company_slug} (auto-generates on first visit)
            # See: /api/v1/roadmap/{company_slug}/regenerate (manual regeneration)

            # ────────────────────────────────────────────────
            # Save platform_scores (GitHub + LeetCode)
            # ────────────────────────────────────────────────
            try:
                from app.models.db import PlatformScore
                from sqlalchemy import delete

                async with async_session_factory() as session:
                    # Delete old platform scores for this user
                    await session.execute(
                        delete(PlatformScore).where(PlatformScore.user_id == current_user.id)
                    )

                    gh = result_dict.get("github_analysis", {})
                    if gh and gh.get("project_depth_score", 0) > 0:
                        session.add(PlatformScore(
                            user_id=current_user.id,
                            platform="github",
                            raw_data=gh,
                            computed_score=gh.get("project_depth_score", 0),
                            breakdown={
                                "project_depth_score": gh.get("project_depth_score", 0),
                                "engineering_maturity_index": gh.get("engineering_maturity_index", 0),
                                "language_distribution": gh.get("language_distribution", {}),
                                "top_projects": gh.get("top_projects", []),
                                "technology_stack": gh.get("technology_stack", []),
                            },
                        ))

                    dsa = result_dict.get("dsa_analysis", {})
                    if dsa and dsa.get("total_solved", 0) > 0:
                        session.add(PlatformScore(
                            user_id=current_user.id,
                            platform="leetcode",
                            raw_data=dsa,
                            computed_score=dsa.get("dsa_depth_score", 0),
                            breakdown={
                                "dsa_depth_score": dsa.get("dsa_depth_score", 0),
                                "total_solved": dsa.get("total_solved", 0),
                                "difficulty_distribution": dsa.get("difficulty_distribution", {}),
                                "topic_weakness_map": dsa.get("topic_weakness_map", {}),
                                "easy_reliance_flag": dsa.get("easy_reliance_flag", False),
                            },
                        ))

                    resume = result_dict.get("resume_data", {})
                    if resume and resume.get("resume_strength_score", 0) > 0:
                        session.add(PlatformScore(
                            user_id=current_user.id,
                            platform="resume",
                            raw_data=resume,
                            computed_score=resume.get("resume_strength_score", 0),
                            breakdown={
                                "resume_strength_score": resume.get("resume_strength_score", 0),
                                "extracted_skills": resume.get("extracted_skills", []),
                                "certifications": resume.get("certifications", []),
                                "internship_count": resume.get("internship_count", 0),
                                "project_count": resume.get("project_count", 0),
                            },
                        ))

                    await session.commit()
                    logger.info(f"Saved platform scores for user {current_user.id}")
            except Exception as e:
                logger.error(f"Failed to save platform scores: {e}")
                import traceback
                traceback.print_exc()

            # ────────────────────────────────────────────────
            # Save user_skill_gaps from gap analysis
            # ────────────────────────────────────────────────
            try:
                from app.models.db import UserSkillGap, GapPriority as DBGapPriority
                from sqlalchemy import delete

                gap = result_dict.get("gap_analysis", {})
                logger.info(f"[GAP DEBUG] gap keys: {list(gap.keys()) if gap else 'NONE'}")
                logger.info(f"[GAP DEBUG] blocking: {len(gap.get('blocking_gaps', []))}, important: {len(gap.get('important_gaps', []))}, nice: {len(gap.get('nice_to_have_gaps', []))}")
                if gap and gap.get("total_gaps", 0) > 0:
                    async with async_session_factory() as session:
                        # Delete old gaps for this user + company
                        for company_slug in payload.target_companies[:3]:
                            await session.execute(
                                delete(UserSkillGap).where(
                                    UserSkillGap.user_id == current_user.id,
                                    UserSkillGap.company_slug == company_slug,
                                )
                            )

                        company_slug = payload.target_companies[0] if payload.target_companies else "google"

                        for gap_item in gap.get("blocking_gaps", []):
                            session.add(UserSkillGap(
                                user_id=current_user.id,
                                company_slug=company_slug,
                                skill_name=gap_item.get("skill", "Unknown"),
                                priority=DBGapPriority.BLOCKING,
                                current_level=_level_to_float(gap_item.get("current_level", "none")),
                                required_level=_level_to_float(gap_item.get("required_level", "expert")),
                                dependency_chain=gap_item.get("dependency_chain", []),
                            ))

                        for gap_item in gap.get("important_gaps", []):
                            session.add(UserSkillGap(
                                user_id=current_user.id,
                                company_slug=company_slug,
                                skill_name=gap_item.get("skill", "Unknown"),
                                priority=DBGapPriority.IMPORTANT,
                                current_level=_level_to_float(gap_item.get("current_level", "none")),
                                required_level=_level_to_float(gap_item.get("required_level", "intermediate")),
                                dependency_chain=gap_item.get("dependency_chain", []),
                            ))

                        for gap_item in gap.get("nice_to_have_gaps", []):
                            session.add(UserSkillGap(
                                user_id=current_user.id,
                                company_slug=company_slug,
                                skill_name=gap_item.get("skill", "Unknown"),
                                priority=DBGapPriority.NICE_TO_HAVE,
                                current_level=_level_to_float(gap_item.get("current_level", "none")),
                                required_level=_level_to_float(gap_item.get("required_level", "basic")),
                                dependency_chain=gap_item.get("dependency_chain", []),
                            ))

                        await session.commit()
                        total_gaps = (
                            len(gap.get("blocking_gaps", []))
                            + len(gap.get("important_gaps", []))
                            + len(gap.get("nice_to_have_gaps", []))
                        )
                        logger.info(f"Saved {total_gaps} skill gaps for user {current_user.id}")
            except Exception as e:
                logger.error(f"Failed to save skill gaps: {e}")
                import traceback
                traceback.print_exc()

            # ────────────────────────────────────────────────
            # Save/update company_match_scores with detailed breakdown
            # ────────────────────────────────────────────────
            try:
                from app.models.db import CompanyMatchScore, UserTargetCompany
                from sqlalchemy import delete
                from app.services.scoring import ScoringEngine

                engine = ScoringEngine()

                async with async_session_factory() as session:
                    for company_slug in payload.target_companies[:3]:
                        # Delete old match score for this user + company
                        await session.execute(
                            delete(CompanyMatchScore).where(
                                CompanyMatchScore.user_id == current_user.id,
                                CompanyMatchScore.company_slug == company_slug,
                            )
                        )

                        # Get blueprint for this company (from the orchestrator result)
                        blueprint = result.company_blueprints.get(company_slug)

                        # Use the proper ScoringEngine with typed Pydantic models
                        score_result = engine.compute_match_score(
                            company_slug=company_slug,
                            github=result.github_analysis,
                            dsa=result.dsa_analysis,
                            resume=result.resume_data,
                            blueprint=blueprint,
                        )

                        breakdown = score_result["component_scores"]
                        overall = score_result["overall_score"]

                        # Status label
                        if overall >= 85:
                            status_label = "Ready"
                        elif overall >= 65:
                            status_label = "Almost Ready"
                        elif overall >= 40:
                            status_label = "Preparing"
                        else:
                            status_label = "Getting Started"

                        weeks_away = max(1, round((100 - overall) / 5))

                        session.add(CompanyMatchScore(
                            user_id=current_user.id,
                            company_slug=company_slug,
                            overall_score=overall,
                            breakdown=breakdown,
                            status_label=status_label,
                            weeks_away=weeks_away,
                        ))

                    # Also save target companies
                    await session.execute(
                        delete(UserTargetCompany).where(
                            UserTargetCompany.user_id == current_user.id
                        )
                    )
                    for company_slug in payload.target_companies[:3]:
                        session.add(UserTargetCompany(
                            user_id=current_user.id,
                            company_slug=company_slug,
                        ))

                    await session.commit()
                    logger.info(f"Saved match scores + target companies for {payload.target_companies[:3]}")
            except Exception as e:
                logger.error(f"Failed to save match scores: {e}")
                import traceback
                traceback.print_exc()

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            try:
                await redis_client.set(
                    f"analysis:{task_id}",
                    json.dumps({"status": "failed", "error": str(e)}),
                    ex=3600,
                )
            except Exception:
                pass

    asyncio.create_task(_run())

    return APIResponse(
        success=True,
        data={"task_id": task_id, "status": "queued"},
    )


@router.get("/status/{task_id}", response_model=APIResponse)
async def get_analysis_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get the status of a running analysis."""
    try:
        data = await redis_client.get(f"analysis:{task_id}")
        if data:
            return APIResponse(success=True, data=json.loads(data))
    except Exception:
        pass

    return APIResponse(success=False, data=None, error="Analysis not found")


@router.websocket("/ws/{task_id}")
async def analysis_websocket(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for real-time analysis progress.
    Streams progress events from Redis.
    """
    await websocket.accept()
    last_index = 0

    try:
        while True:
            # Check for new progress events
            try:
                events = await redis_client.lrange(f"analysis:progress:{task_id}", last_index, -1)
                for event in events:
                    await websocket.send_text(event)
                    last_index += 1
            except Exception:
                pass

            # Check if analysis is complete
            try:
                status_data = await redis_client.get(f"analysis:{task_id}")
                if status_data:
                    parsed = json.loads(status_data)
                    if parsed.get("status") in ("complete", "failed"):
                        await websocket.send_text(json.dumps({
                            "event": "done",
                            "status": parsed["status"],
                        }))
                        break
            except Exception:
                pass

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for task {task_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# ────────────────────────────────────────────────
# Fill Gaps + Coaching — runs agents individually
# to avoid Groq rate limits from the full pipeline
# ────────────────────────────────────────────────
@router.post("/fill-gaps")
async def fill_gaps_and_coaching(
    current_user: User = Depends(get_current_user),
):
    """Run Gap Finder + Career Coach agents individually and persist to DB."""
    from app.core.database import async_session_factory
    from app.models.db import UserSkillGap, GapPriority as DBGapPriority
    from sqlalchemy import text, delete

    results = {"gaps_saved": 0, "coaching_saved": False, "errors": []}

    # Get user's skills from platform_scores
    user_skills = set()
    async with async_session_factory() as session:
        r = await session.execute(
            text("SELECT breakdown FROM platform_scores WHERE user_id = :uid"),
            {"uid": str(current_user.id)},
        )
        for row in r.fetchall():
            bd = row[0] or {}
            # GitHub languages
            if "language_distribution" in bd:
                user_skills.update(bd["language_distribution"].keys())
            if "technology_stack" in bd:
                user_skills.update(bd["technology_stack"])
            # Resume skills
            if "extracted_skills" in bd:
                user_skills.update(bd["extracted_skills"])

    if not user_skills:
        user_skills = {'TypeScript', 'JavaScript', 'HTML', 'CSS', 'C', 'Git', 'React',
                       'Express.js', 'Supabase', 'SQL', 'Tailwind CSS', 'Node.js', 'REST API'}

    # Get required skills from company blueprint DB
    required_skills = set()
    async with async_session_factory() as session:
        from app.models.db import CompanyBlueprint
        from sqlalchemy import select
        r = await session.execute(
            select(CompanyBlueprint).where(CompanyBlueprint.slug == "google")
        )
        bp = r.scalar_one_or_none()
        if bp:
            tech = bp.tech_stack or {}
            if isinstance(tech, dict):
                for v in tech.values():
                    if isinstance(v, list):
                        required_skills.update(v)
                    elif isinstance(v, str):
                        required_skills.add(v)
            elif isinstance(tech, list):
                required_skills.update(tech)

    if not required_skills:
        required_skills = {'Cloud (GCP)', 'Distributed Systems', 'C++', 'ML/AI',
                           'Go', 'Java', 'Python', 'System Design'}

    # ── Agent 6: Gap Finder ──
    try:
        from agents.gap_finder import run_gap_finder
        gap_result = await run_gap_finder(
            user_skills=list(user_skills),
            required_skills=list(required_skills),
            company_name="google",
        )
        gap_dict = gap_result.model_dump()

        # Persist to user_skill_gaps
        async with async_session_factory() as session:
            await session.execute(
                delete(UserSkillGap).where(
                    UserSkillGap.user_id == current_user.id,
                    UserSkillGap.company_slug == "google",
                )
            )

            all_gaps = (
                [(g, DBGapPriority.BLOCKING) for g in gap_dict.get("blocking_gaps", [])]
                + [(g, DBGapPriority.IMPORTANT) for g in gap_dict.get("important_gaps", [])]
                + [(g, DBGapPriority.NICE_TO_HAVE) for g in gap_dict.get("nice_to_have_gaps", [])]
            )

            for gap_item, priority in all_gaps:
                session.add(UserSkillGap(
                    user_id=current_user.id,
                    company_slug="google",
                    skill_name=gap_item.get("skill", "Unknown"),
                    priority=priority,
                    current_level=_level_to_float(gap_item.get("current_level", "none")),
                    required_level=_level_to_float(gap_item.get("required_level", "expert")),
                    dependency_chain=gap_item.get("dependency_chain", []),
                ))

            await session.commit()
            results["gaps_saved"] = len(all_gaps)
            logger.info(f"Saved {len(all_gaps)} skill gaps for user {current_user.id}")
    except Exception as e:
        logger.error(f"Gap Finder failed: {e}")
        results["errors"].append(f"Gap Finder: {str(e)}")

    # Brief pause to avoid rate limit
    await asyncio.sleep(3)

    # ── Agent 8: Career Coach ──
    try:
        from agents.career_coach import run_career_coach

        # Get scores for coaching input
        async with async_session_factory() as session:
            r = await session.execute(
                text("SELECT platform, computed_score, breakdown FROM platform_scores WHERE user_id = :uid"),
                {"uid": str(current_user.id)},
            )
            scores = {row[0]: {"score": row[1], "breakdown": row[2] or {}} for row in r.fetchall()}

        gh = scores.get("github", {})
        dsa = scores.get("leetcode", {})
        resume = scores.get("resume", {})

        coaching_input = {
            "github_score": gh.get("score", 0),
            "engineering_maturity": gh.get("breakdown", {}).get("engineering_maturity_index", 65),
            "top_languages": list(gh.get("breakdown", {}).get("language_distribution", {}).keys())[:5],
            "key_weaknesses": gh.get("breakdown", {}).get("key_weaknesses", []),
            "dsa_score": dsa.get("score", 0),
            "total_solved": dsa.get("breakdown", {}).get("total_solved", 0),
            "difficulty_distribution": dsa.get("breakdown", {}).get("difficulty_distribution", {}),
            "topic_weaknesses": list(dsa.get("breakdown", {}).get("topic_weakness_map", {}).keys())[:5],
            "resume_score": resume.get("score", 0),
            "extracted_skills": resume.get("breakdown", {}).get("extracted_skills", [])[:10],
            "blocking_gaps": [g.get("skill") for g in gap_dict.get("blocking_gaps", [])] if 'gap_dict' in locals() else [],
            "important_gaps": [g.get("skill") for g in gap_dict.get("important_gaps", [])] if 'gap_dict' in locals() else [],
            "target_companies": ["google"],
            "overall_readiness": 56.3,
        }

        coach_result = await run_career_coach(coaching_input)
        coach_dict = coach_result.model_dump()

        # Save coaching to analysis_results
        async with async_session_factory() as session:
            await session.execute(
                text(
                    "UPDATE analysis_results SET coaching_message = :msg "
                    "WHERE user_id = :uid AND completed_at = "
                    "(SELECT MAX(completed_at) FROM analysis_results WHERE user_id = :uid)"
                ),
                {"msg": coach_dict["coaching_message"], "uid": str(current_user.id)},
            )
            await session.commit()

        results["coaching_saved"] = True
        results["coaching_length"] = len(coach_dict["coaching_message"])
        results["top_actions"] = coach_dict["top_3_actions"]
        logger.info(f"Saved coaching ({len(coach_dict['coaching_message'])} chars)")
    except Exception as e:
        logger.error(f"Career Coach failed: {e}")
        results["errors"].append(f"Career Coach: {str(e)}")

    return APIResponse(success=True, data=results)


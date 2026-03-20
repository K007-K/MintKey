# Weighted scoring algorithm — company-specific weight distributions
import logging
from typing import Optional
from agents.core.models import (
    GitHubAnalysis,
    DSAAnalysis,
    ResumeData,
    CompanyBlueprintModel,
)

logger = logging.getLogger(__name__)

# Company-specific weight distributions (must sum to 100)
COMPANY_WEIGHTS: dict[str, dict[str, int]] = {
    "google": {
        "dsa": 40,
        "projects": 20,
        "academic": 10,
        "stack": 15,
        "internship": 10,
        "aptitude": 0,
        "consistency": 5,
    },
    "amazon": {
        "dsa": 35,
        "projects": 15,
        "academic": 10,
        "stack": 15,
        "internship": 15,
        "aptitude": 0,
        "consistency": 10,
    },
    "microsoft": {
        "dsa": 35,
        "projects": 20,
        "academic": 10,
        "stack": 15,
        "internship": 10,
        "aptitude": 0,
        "consistency": 10,
    },
    "flipkart": {
        "dsa": 35,
        "projects": 20,
        "academic": 10,
        "stack": 15,
        "internship": 10,
        "aptitude": 0,
        "consistency": 10,
    },
    "razorpay": {
        "dsa": 20,
        "projects": 30,
        "academic": 10,
        "stack": 25,
        "internship": 10,
        "aptitude": 0,
        "consistency": 5,
    },
    "tcs": {
        "dsa": 15,
        "projects": 10,
        "academic": 25,
        "stack": 10,
        "internship": 10,
        "aptitude": 25,
        "consistency": 5,
    },
    "infosys": {
        "dsa": 15,
        "projects": 10,
        "academic": 25,
        "stack": 10,
        "internship": 10,
        "aptitude": 25,
        "consistency": 5,
    },
    "wipro": {
        "dsa": 10,
        "projects": 10,
        "academic": 25,
        "stack": 10,
        "internship": 10,
        "aptitude": 30,
        "consistency": 5,
    },
    "startup": {
        "dsa": 15,
        "projects": 40,
        "academic": 5,
        "stack": 20,
        "internship": 15,
        "aptitude": 0,
        "consistency": 5,
    },
    "zepto": {
        "dsa": 25,
        "projects": 30,
        "academic": 5,
        "stack": 20,
        "internship": 15,
        "aptitude": 0,
        "consistency": 5,
    },
    "cred": {
        "dsa": 25,
        "projects": 30,
        "academic": 5,
        "stack": 25,
        "internship": 10,
        "aptitude": 0,
        "consistency": 5,
    },
    "phonpe": {
        "dsa": 30,
        "projects": 20,
        "academic": 10,
        "stack": 20,
        "internship": 10,
        "aptitude": 0,
        "consistency": 10,
    },
    "groww": {
        "dsa": 25,
        "projects": 25,
        "academic": 10,
        "stack": 20,
        "internship": 15,
        "aptitude": 0,
        "consistency": 5,
    },
    "swiggy": {
        "dsa": 30,
        "projects": 20,
        "academic": 10,
        "stack": 20,
        "internship": 10,
        "aptitude": 0,
        "consistency": 10,
    },
    "blinkit": {
        "dsa": 25,
        "projects": 25,
        "academic": 10,
        "stack": 20,
        "internship": 15,
        "aptitude": 0,
        "consistency": 5,
    },
    "meesho": {
        "dsa": 25,
        "projects": 25,
        "academic": 10,
        "stack": 20,
        "internship": 15,
        "aptitude": 0,
        "consistency": 5,
    },
}

# Default weights for unknown companies
DEFAULT_WEIGHTS = {
    "dsa": 25,
    "projects": 25,
    "academic": 10,
    "stack": 20,
    "internship": 15,
    "aptitude": 0,
    "consistency": 5,
}


class ScoringEngine:
    """Compute weighted match scores for users against companies."""

    # Mapping from DB scoring_weights keys (decimal) to component keys (integer)
    _DB_WEIGHT_MAP = {
        "dsa_score": "dsa",
        "project_score": "projects",
        "academic_score": "academic",
        "stack_alignment": "stack",
        "system_design_score": "stack",  # maps to stack if no dedicated scorer
        "internship_score": "internship",
        "behavioral_score": "aptitude",
        "consistency_index": "consistency",
    }

    def _resolve_weights(
        self, company_slug: str, blueprint: Optional[CompanyBlueprintModel] = None
    ) -> dict[str, int]:
        """
        Resolve scoring weights for a company. Priority:
        1. Blueprint scoring_weights from DB (decimal format, e.g. 0.35)
        2. Hardcoded COMPANY_WEIGHTS dict (integer format, e.g. 35)
        3. DEFAULT_WEIGHTS fallback
        """
        # Try DB weights first (decimal format from JSONB)
        if blueprint and hasattr(blueprint, "scoring_weights") and blueprint.scoring_weights:
            db_weights = blueprint.scoring_weights
            resolved = {}
            for db_key, component_key in self._DB_WEIGHT_MAP.items():
                if db_key in db_weights:
                    val = float(db_weights[db_key])
                    # Convert decimal (0.35) → integer (35) if < 1.0
                    weight_int = int(val * 100) if val < 1.0 else int(val)
                    # Merge if component already exists (e.g., system_design → stack)
                    resolved[component_key] = resolved.get(component_key, 0) + weight_int
            # Fill missing components with 0
            for key in DEFAULT_WEIGHTS:
                if key not in resolved:
                    resolved[key] = 0
            logger.info(f"Using DB scoring weights for {company_slug}: {resolved}")
            return resolved

        # Fall back to hardcoded weights
        return COMPANY_WEIGHTS.get(company_slug.lower(), DEFAULT_WEIGHTS)

    def compute_match_score(
        self,
        company_slug: str,
        github: Optional[GitHubAnalysis] = None,
        dsa: Optional[DSAAnalysis] = None,
        resume: Optional[ResumeData] = None,
        blueprint: Optional[CompanyBlueprintModel] = None,
        platform_dsa_progress: Optional[dict] = None,
    ) -> dict:
        """
        Compute a weighted match score (0-100) for a user against a company.
        Returns score breakdown by component.
        """
        weights = self._resolve_weights(company_slug, blueprint)

        # Component scores (0-100 each)
        scores = {
            "dsa": self._score_dsa(dsa, platform_dsa_progress),
            "projects": self._score_projects(github),
            "academic": self._score_academic(resume, blueprint),
            "stack": self._score_stack(github, resume, blueprint),
            "internship": self._score_internship(resume),
            "aptitude": self._score_aptitude(resume),
            "consistency": self._score_consistency(github, dsa),
        }

        # Weighted total
        total = sum(
            scores[component] * (weight / 100)
            for component, weight in weights.items()
        )

        return {
            "company": company_slug,
            "overall_score": round(total, 1),
            "component_scores": scores,
            "weights": weights,
            "grade": self._score_to_grade(total),
            "readiness": self._score_to_readiness(total),
        }

    def _score_dsa(
        self, dsa: Optional[DSAAnalysis], platform_progress: Optional[dict] = None
    ) -> float:
        """Score DSA proficiency (0-100).

        Blends two signals:
        - LeetCode external score (from Agent 2 / DSAAnalysis)
        - Platform progress (from user_dsa_progress table)

        If both exist: 40% LeetCode + 60% Platform (reward using our system).
        If only one exists: use that alone.
        """
        leetcode_score = 0.0
        platform_score = 0.0
        has_leetcode = False
        has_platform = False

        # LeetCode score
        if dsa:
            has_leetcode = True
            if dsa.dsa_depth_score > 0:
                leetcode_score = min(dsa.dsa_depth_score, 100)
            else:
                total = dsa.total_solved
                if total >= 400:
                    leetcode_score = 90
                elif total >= 300:
                    leetcode_score = 75
                elif total >= 200:
                    leetcode_score = 60
                elif total >= 100:
                    leetcode_score = 45
                elif total >= 50:
                    leetcode_score = 30
                else:
                    leetcode_score = max(total * 0.5, 5)

        # Platform progress score
        if platform_progress:
            total_solved = platform_progress.get("total_solved", 0)
            topics_touched = len(platform_progress.get("by_topic", {}))

            if total_solved > 0:
                has_platform = True
                # Coverage: how many of 150 (NeetCode baseline) solved
                coverage = min(total_solved / 150, 1.0)
                # Breadth: how many topics touched out of ~18
                breadth = min(topics_touched / 18, 1.0)
                # Difficulty balance bonus
                easy = platform_progress.get("easy", 0)
                medium = platform_progress.get("medium", 0)
                hard = platform_progress.get("hard", 0)
                diff_total = easy + medium + hard
                balance = 0.5
                if diff_total > 0:
                    # Reward having medium+hard over easy-heavy
                    balance = min(((medium * 1.5 + hard * 3) / diff_total) / 2, 1.0)

                platform_score = (coverage * 0.5 + breadth * 0.3 + balance * 0.2) * 100

        # Blend
        if has_leetcode and has_platform:
            return min(leetcode_score * 0.4 + platform_score * 0.6, 100)
        elif has_platform:
            return min(platform_score, 100)
        elif has_leetcode:
            return leetcode_score
        return 0

    def _score_projects(self, github: Optional[GitHubAnalysis]) -> float:
        """Score project quality (0-100)."""
        if not github:
            return 0

        score = github.project_depth_score
        if score > 0:
            return min(score, 100)
        return 20  # Default baseline

    def _score_academic(
        self, resume: Optional[ResumeData], blueprint: Optional[CompanyBlueprintModel]
    ) -> float:
        """Score academic eligibility (0-100)."""
        if not resume or not resume.cgpa:
            return 50  # Neutral if unknown

        cgpa = resume.cgpa
        scale = resume.cgpa_scale or 10.0
        normalized = (cgpa / scale) * 10  # Normalize to 10-point scale

        cutoff = blueprint.cgpa_cutoff if blueprint else 6.0

        if normalized >= cutoff + 1.5:
            return 95
        elif normalized >= cutoff + 0.5:
            return 80
        elif normalized >= cutoff:
            return 65
        elif normalized >= cutoff - 0.5:
            return 45
        else:
            return 25

    def _score_stack(
        self,
        github: Optional[GitHubAnalysis],
        resume: Optional[ResumeData],
        blueprint: Optional[CompanyBlueprintModel],
    ) -> float:
        """Score technology stack match (0-100)."""
        if not blueprint or not blueprint.required_skills:
            return 50

        user_skills = set()
        if github:
            user_skills.update(s.lower() for s in github.technology_stack)
        if resume:
            user_skills.update(s.lower() for s in resume.extracted_skills)

        required = {s.lower() for s in blueprint.required_skills}
        if not required:
            return 50

        matched = user_skills & required
        match_pct = len(matched) / len(required) * 100

        return min(match_pct, 100)

    def _score_internship(self, resume: Optional[ResumeData]) -> float:
        """Score internship experience (0-100)."""
        if not resume:
            return 0

        count = resume.internship_count
        if count >= 3:
            return 95
        elif count == 2:
            return 75
        elif count == 1:
            return 50
        return 15

    def _score_aptitude(self, resume: Optional[ResumeData]) -> float:
        """Score aptitude/general readiness (0-100)."""
        if not resume:
            return 50

        # Based on resume strength as proxy
        return min(resume.resume_strength_score, 100) if resume.resume_strength_score else 50

    def _score_consistency(
        self, github: Optional[GitHubAnalysis], dsa: Optional[DSAAnalysis]
    ) -> float:
        """Score consistency/regularity (0-100)."""
        score = 50  # Baseline

        if github and github.engineering_maturity_index > 0:
            score = (score + github.engineering_maturity_index) / 2

        if dsa and dsa.contest_rating:
            if dsa.contest_rating >= 1800:
                score = min(score + 20, 100)
            elif dsa.contest_rating >= 1500:
                score = min(score + 10, 100)

        return score

    def _score_to_grade(self, score: float) -> str:
        """Convert score to letter grade."""
        if score >= 90:
            return "A+"
        elif score >= 80:
            return "A"
        elif score >= 70:
            return "B+"
        elif score >= 60:
            return "B"
        elif score >= 50:
            return "C+"
        elif score >= 40:
            return "C"
        elif score >= 30:
            return "D"
        return "F"

    def _score_to_readiness(self, score: float) -> str:
        """Convert score to readiness label."""
        if score >= 80:
            return "Interview Ready"
        elif score >= 60:
            return "Almost Ready"
        elif score >= 40:
            return "Needs Preparation"
        elif score >= 20:
            return "Significant Gaps"
        return "Early Stage"

    def compute_all_scores(
        self,
        target_companies: list[str],
        github: Optional[GitHubAnalysis] = None,
        dsa: Optional[DSAAnalysis] = None,
        resume: Optional[ResumeData] = None,
        blueprints: Optional[dict[str, CompanyBlueprintModel]] = None,
        platform_dsa_progress: Optional[dict] = None,
    ) -> dict[str, dict]:
        """Compute match scores for all target companies."""
        results = {}
        for company in target_companies:
            blueprint = blueprints.get(company) if blueprints else None
            results[company] = self.compute_match_score(
                company_slug=company,
                github=github,
                dsa=dsa,
                resume=resume,
                blueprint=blueprint,
                platform_dsa_progress=platform_dsa_progress,
            )
        return results

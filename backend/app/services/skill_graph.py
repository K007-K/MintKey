# Skill graph service — queries HelixDB (uses local fallback for now)
import logging
from helix.seed_skills import get_prerequisites, get_dependents, SKILL_GRAPH

logger = logging.getLogger(__name__)


class SkillGraphService:
    """Service for querying the skill dependency graph."""

    def get_skill_prerequisites(self, skill: str, depth: int = 3) -> list[str]:
        """Get prerequisite chain for a skill."""
        return get_prerequisites(skill, depth)

    def get_skill_dependents(self, skill: str) -> list[str]:
        """Get skills that depend on this skill."""
        return get_dependents(skill)

    def get_skill_category(self, skill: str) -> str:
        """Get the category of a skill."""
        data = SKILL_GRAPH.get(skill, {})
        return data.get("category", "unknown")

    def get_learning_order(self, target_skills: list[str]) -> list[str]:
        """Get optimal learning order (topological sort of prerequisites)."""
        all_needed = set()
        for skill in target_skills:
            all_needed.add(skill)
            all_needed.update(self.get_skill_prerequisites(skill))

        # Topological sort
        visited = set()
        order = []

        def visit(skill_name: str):
            if skill_name in visited:
                return
            visited.add(skill_name)
            for dep in SKILL_GRAPH.get(skill_name, {}).get("deps", []):
                if dep in all_needed:
                    visit(dep)
            order.append(skill_name)

        for skill in all_needed:
            visit(skill)

        return order

    def compute_skill_gap(
        self, user_skills: list[str], required_skills: list[str]
    ) -> dict:
        """Compute skill gaps with dependency chains."""
        user_set = {s.lower() for s in user_skills}
        gaps = []

        for skill in required_skills:
            if skill.lower() not in user_set:
                prereqs = self.get_skill_prerequisites(skill)
                missing_prereqs = [p for p in prereqs if p.lower() not in user_set]
                gaps.append({
                    "skill": skill,
                    "missing_prerequisites": missing_prereqs,
                    "total_chain_length": len(missing_prereqs) + 1,
                    "category": self.get_skill_category(skill),
                })

        # Sort by chain length (hardest gaps first)
        gaps.sort(key=lambda g: g["total_chain_length"], reverse=True)

        return {
            "gaps": gaps,
            "total_gaps": len(gaps),
            "learning_order": self.get_learning_order(
                [g["skill"] for g in gaps]
            ),
        }

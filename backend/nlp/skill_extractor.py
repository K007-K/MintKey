# Skill extractor — matches resume/GitHub data against skill taxonomy
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

TAXONOMY_PATH = Path(__file__).parent / "skill_taxonomy.json"


class SkillExtractor:
    """Extract and match skills against the MintKey skill taxonomy."""

    def __init__(self) -> None:
        self.taxonomy: dict = {}
        self.skill_lookup: dict[str, dict] = {}  # lowercase name → skill info
        self._load_taxonomy()

    def _load_taxonomy(self) -> None:
        """Load skill taxonomy from JSON file."""
        try:
            with open(TAXONOMY_PATH) as f:
                self.taxonomy = json.load(f)
            # Build lookup index
            for category, skills in self.taxonomy.get("categories", {}).items():
                for skill in skills:
                    name_lower = skill["name"].lower()
                    self.skill_lookup[name_lower] = {**skill, "category": category}
                    # Also index aliases
                    for alias in skill.get("aliases", []):
                        self.skill_lookup[alias.lower()] = {**skill, "category": category}
            logger.info(f"Loaded {len(self.skill_lookup)} skill entries from taxonomy")
        except FileNotFoundError:
            logger.warning("Skill taxonomy file not found — running with empty taxonomy")
        except Exception as e:
            logger.error(f"Failed to load skill taxonomy: {e}")

    def extract_from_text(self, text: str) -> list[dict]:
        """
        Extract skills from a text block by matching against taxonomy.
        Returns list of matched skills with frequency counts.
        """
        text_lower = text.lower()
        found: dict[str, dict] = {}

        for skill_name, skill_info in self.skill_lookup.items():
            # Word boundary check to avoid partial matches
            if f" {skill_name} " in f" {text_lower} " or \
               f" {skill_name}," in f" {text_lower}," or \
               f" {skill_name}." in f" {text_lower}." or \
               f" {skill_name}\n" in f" {text_lower}\n" or \
               text_lower.startswith(skill_name + " ") or \
               text_lower.endswith(" " + skill_name):

                canonical = skill_info["name"]
                if canonical not in found:
                    count = text_lower.count(skill_name)
                    found[canonical] = {
                        "name": canonical,
                        "category": skill_info["category"],
                        "frequency": count,
                        "proficiency": skill_info.get("level", "intermediate"),
                    }
                else:
                    found[canonical]["frequency"] += text_lower.count(skill_name)

        # Sort by frequency descending
        return sorted(found.values(), key=lambda x: -x["frequency"])

    def extract_from_languages(self, language_distribution: dict[str, float]) -> list[dict]:
        """
        Extract skills from GitHub language distribution.
        Maps programming languages to taxonomy entries.
        """
        found = []
        for lang, pct in language_distribution.items():
            lang_lower = lang.lower()
            if lang_lower in self.skill_lookup:
                skill = self.skill_lookup[lang_lower]
                # Assign proficiency based on usage percentage
                if pct >= 30:
                    level = "advanced"
                elif pct >= 10:
                    level = "intermediate"
                else:
                    level = "beginner"

                found.append({
                    "name": skill["name"],
                    "category": skill["category"],
                    "usage_pct": pct,
                    "proficiency": level,
                })

        return sorted(found, key=lambda x: -x["usage_pct"])

    def compute_skill_demand_index(
        self, user_skills: list[str], required_skills: list[str]
    ) -> dict:
        """
        Compute Skill Demand Index — how well user skills match required skills.
        Returns match percentage and lists of matched/missing skills.
        """
        user_set = {s.lower() for s in user_skills}
        required_set = {s.lower() for s in required_skills}

        matched = user_set & required_set
        missing = required_set - user_set
        extra = user_set - required_set

        total_required = len(required_set) or 1

        return {
            "match_pct": round(len(matched) / total_required * 100, 1),
            "matched_skills": sorted(matched),
            "missing_skills": sorted(missing),
            "extra_skills": sorted(extra),
            "total_required": len(required_set),
            "total_user": len(user_set),
        }

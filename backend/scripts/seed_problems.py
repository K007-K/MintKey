# Seed script — imports problems from JSON seed files into external_problems table
# Handles deduplication across NeetCode 150, NeetCode All, Blind 75, Striver A2Z, CSES
import asyncio
import json
import logging
from pathlib import Path
from sqlalchemy import text
from app.core.database import async_engine

logger = logging.getLogger(__name__)

SEED_DIR = Path(__file__).resolve().parent.parent.parent / "mintkey_seed_data"


def _slugify(title: str) -> str:
    """Convert problem title to URL slug."""
    return title.lower().replace(" ", "-").replace("'", "").replace(",", "").replace("(", "").replace(")", "")


def _load_neetcode_150() -> list[dict]:
    """NeetCode 150: { topics: { "Arrays & Hashing": [{lc_number, title, difficulty, url, ...}] } }"""
    filepath = SEED_DIR / "neetcode_150.json"
    if not filepath.exists():
        return []
    data = json.load(open(filepath))
    problems = []
    for topic_name, topic_problems in data.get("topics", {}).items():
        if not isinstance(topic_problems, list):
            continue
        for p in topic_problems:
            problems.append({
                "source": "neetcode",
                "external_id": str(p.get("lc_number", "")),
                "title": p.get("title", "Untitled"),
                "slug": _slugify(p.get("title", "")),
                "difficulty": p.get("difficulty", "Medium"),
                "tags": [topic_name.lower()],
                "url": p.get("url", ""),
                "category": "dsa",
                "study_plans": p.get("study_plans", ["neetcode_150"]),
                "pattern": None,
                "lc_number": p.get("lc_number"),
            })
    return problems


def _load_neetcode_all() -> list[dict]:
    """NeetCode All Problems — superset of 150."""
    filepath = SEED_DIR / "neetcode_all_problems.json"
    if not filepath.exists():
        return []
    data = json.load(open(filepath))
    problems = []
    for topic_name, topic_problems in data.get("topics", {}).items():
        if not isinstance(topic_problems, list):
            continue
        for p in topic_problems:
            problems.append({
                "source": "neetcode",
                "external_id": str(p.get("lc_number", "")),
                "title": p.get("title", "Untitled"),
                "slug": _slugify(p.get("title", "")),
                "difficulty": p.get("difficulty", "Medium"),
                "tags": [topic_name.lower()],
                "url": p.get("url", ""),
                "category": "dsa",
                "study_plans": p.get("study_plans", ["neetcode_all"]),
                "pattern": None,
                "lc_number": p.get("lc_number"),
            })
    return problems


def _load_blind_75() -> list[dict]:
    """Blind 75: { problems: [{title, topic, difficulty}] }"""
    filepath = SEED_DIR / "blind_75.json"
    if not filepath.exists():
        return []
    data = json.load(open(filepath))
    problems = []
    for p in data.get("problems", []):
        problems.append({
            "source": "blind75",
            "external_id": None,
            "title": p.get("title", "Untitled"),
            "slug": _slugify(p.get("title", "")),
            "difficulty": p.get("difficulty", "Medium"),
            "tags": [p.get("topic", "general").lower()],
            "url": None,
            "category": "dsa",
            "study_plans": ["blind_75"],
            "pattern": None,
            "lc_number": None,
        })
    return problems


def _load_striver_a2z() -> list[dict]:
    """Striver A2Z: { topics: { "topic": { subtopics:[], problems:[], ... } } }"""
    filepath = SEED_DIR / "striver_a2z_full.json"
    if not filepath.exists():
        return []
    data = json.load(open(filepath))
    problems = []
    for topic_name, value in data.get("topics", {}).items():
        if not isinstance(value, dict):
            continue
        topic_probs = value.get("problems", [])
        if not isinstance(topic_probs, list):
            continue
        for p in topic_probs:
            if not isinstance(p, dict):
                continue
            # Skip non-problem entries (concepts, type=concept)
            if p.get("type") == "concept":
                continue
            problems.append({
                "source": "striver",
                "external_id": None,
                "title": p.get("title", "Untitled"),
                "slug": _slugify(p.get("title", "")),
                "difficulty": p.get("difficulty", "Medium"),
                "tags": [topic_name.lower()],
                "url": p.get("url", None),
                "category": "dsa",
                "study_plans": ["striver_a2z"],
                "pattern": None,
                "lc_number": p.get("lc_number"),
            })
    return problems


def _load_cses() -> list[dict]:
    """CSES: { categories: [ { name: "...", problems: ["title1", "title2", ...] } ] }"""
    filepath = SEED_DIR / "cses_problems.json"
    if not filepath.exists():
        return []
    data = json.load(open(filepath))
    problems = []
    categories = data.get("categories", [])
    if not isinstance(categories, list):
        return []
    for cat in categories:
        if not isinstance(cat, dict):
            continue
        cat_name = cat.get("name", "General")
        cat_probs = cat.get("problems", [])
        if not isinstance(cat_probs, list):
            continue
        for p in cat_probs:
            title = p if isinstance(p, str) else p.get("title", "Untitled") if isinstance(p, dict) else str(p)
            problems.append({
                "source": "cses",
                "external_id": None,
                "title": title,
                "slug": _slugify(title),
                "difficulty": p.get("difficulty", None) if isinstance(p, dict) else None,
                "tags": [cat_name.lower()],
                "url": f"https://cses.fi/problemset/task/{_slugify(title)}",
                "category": "competitive",
                "study_plans": ["cses"],
                "pattern": None,
                "lc_number": None,
            })
    return problems


def _deduplicate(all_problems: list[dict]) -> list[dict]:
    """Deduplicate problems by title (case-insensitive).

    When duplicate found:
    - Merge study_plans arrays
    - Keep the version with more data (lc_number, url, etc.)
    """
    seen: dict[str, dict] = {}  # key = lowercase title

    for p in all_problems:
        key = p["title"].strip().lower()

        if key not in seen:
            seen[key] = p
        else:
            existing = seen[key]
            # Merge study plans
            existing_plans = set(existing.get("study_plans") or [])
            new_plans = set(p.get("study_plans") or [])
            existing["study_plans"] = list(existing_plans | new_plans)
            # Prefer version with lc_number
            if not existing.get("lc_number") and p.get("lc_number"):
                existing["lc_number"] = p["lc_number"]
                existing["external_id"] = str(p["lc_number"])
            # Prefer version with URL
            if not existing.get("url") and p.get("url"):
                existing["url"] = p["url"]
            # Merge tags
            existing_tags = set(existing.get("tags") or [])
            new_tags = set(p.get("tags") or [])
            existing["tags"] = list(existing_tags | new_tags)

    return list(seen.values())


async def seed_problems():
    """Load all problem sources, deduplicate, and insert into external_problems table."""
    logger.info("Loading problem sources...")

    # Load from all sources
    neetcode_150 = _load_neetcode_150()
    neetcode_all = _load_neetcode_all()
    blind_75 = _load_blind_75()
    striver = _load_striver_a2z()
    cses = _load_cses()

    logger.info(f"Loaded: NeetCode 150={len(neetcode_150)}, NeetCode All={len(neetcode_all)}, "
                f"Blind 75={len(blind_75)}, Striver={len(striver)}, CSES={len(cses)}")

    # Combine and deduplicate
    all_problems = neetcode_all + neetcode_150 + striver + blind_75 + cses
    deduped = _deduplicate(all_problems)

    logger.info(f"After dedup: {len(all_problems)} → {len(deduped)} unique problems")

    # Insert into database
    async with async_engine.begin() as conn:
        # Clear existing data
        await conn.execute(text("DELETE FROM user_problem_progress"))
        await conn.execute(text("DELETE FROM external_problems"))

        # Batch insert
        inserted = 0
        for p in deduped:
            await conn.execute(
                text("""
                    INSERT INTO external_problems
                        (source, external_id, title, slug, difficulty, tags, url, category,
                         study_plans, pattern, lc_number)
                    VALUES
                        (:source, :external_id, :title, :slug, :difficulty, :tags, :url, :category,
                         :study_plans, :pattern, :lc_number)
                """),
                {
                    "source": p["source"],
                    "external_id": p.get("external_id"),
                    "title": p["title"],
                    "slug": p.get("slug"),
                    "difficulty": p.get("difficulty"),
                    "tags": p.get("tags"),
                    "url": p.get("url"),
                    "category": p.get("category", "dsa"),
                    "study_plans": p.get("study_plans"),
                    "pattern": p.get("pattern"),
                    "lc_number": p.get("lc_number"),
                },
            )
            inserted += 1

        logger.info(f"Inserted {inserted} problems into external_problems table")

    return {"total_loaded": len(all_problems), "after_dedup": len(deduped), "inserted": inserted}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = asyncio.run(seed_problems())
    print(f"\nSeed complete: {result}")

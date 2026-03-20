# DSA problems API — serves seed data from JSON files
import json
import logging
from pathlib import Path
from functools import lru_cache
from fastapi import APIRouter, Query

from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dsa", tags=["dsa"])

SEED_DIR = Path(__file__).resolve().parent.parent.parent.parent / "mintkey_seed_data"

SHEET_FILES = {
    "neetcode_150": "neetcode_150.json",
    "blind_75": "blind_75.json",
    "striver_a2z": "striver_a2z_full.json",
}


@lru_cache(maxsize=4)
def _load_sheet(sheet_key: str) -> dict:
    """Load and cache a DSA sheet JSON file.

    Handles 3 formats:
      - NeetCode: { topics: { "Arrays": [{lc_number, title, ...}] } }
      - Blind 75: { problems: [{title, topic, difficulty}] }  (flat list)
      - Striver:  { topics: { "Arrays": { subtopics:[], problems:[], ... } } }
    """
    filename = SHEET_FILES.get(sheet_key)
    if not filename:
        return {"source": sheet_key, "total": 0, "topics": {}}
    filepath = SEED_DIR / filename
    if not filepath.exists():
        logger.warning(f"Seed file not found: {filepath}")
        return {"source": sheet_key, "total": 0, "topics": {}}
    with open(filepath) as f:
        data = json.load(f)

    normalised: dict[str, list] = {}

    # Format 1: flat "problems" list (Blind 75) — group by topic field
    if "problems" in data and isinstance(data["problems"], list):
        for p in data["problems"]:
            topic = p.get("topic", "General")
            normalised.setdefault(topic, []).append(p)

    # Format 2+3: "topics" key
    elif "topics" in data and isinstance(data["topics"], dict):
        for topic_name, value in data["topics"].items():
            if isinstance(value, list):
                # Format 2 — NeetCode: value is already a list of problems
                normalised[topic_name] = value
            elif isinstance(value, dict):
                # Format 3 — Striver: value is { subtopics:[], problems:[], ... }
                problems = value.get("problems", [])
                if isinstance(problems, list):
                    normalised[topic_name] = problems

    total = sum(len(v) for v in normalised.values())
    return {
        "source": data.get("source", sheet_key),
        "total": total,
        "topics": normalised,
    }


@lru_cache(maxsize=1)
def _load_company_problems() -> dict:
    """Load company-wise problem mapping."""
    filepath = SEED_DIR / "company_wise_problems.json"
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


@router.get("/problems", response_model=APIResponse)
async def get_dsa_problems(
    sheet: str = Query("neetcode_150", description="Sheet: neetcode_150 | blind_75 | striver_a2z"),
):
    """Get all DSA problems for a given study sheet."""
    data = _load_sheet(sheet)
    return APIResponse(success=True, data=data)


@router.get("/sheets", response_model=APIResponse)
async def get_available_sheets():
    """List available DSA sheets with problem counts."""
    sheets = []
    for key in SHEET_FILES:
        data = _load_sheet(key)
        sheets.append({
            "key": key,
            "name": data["source"],
            "total": data["total"],
        })
    return APIResponse(success=True, data=sheets)


@router.get("/company/{slug}", response_model=APIResponse)
async def get_company_problems(slug: str):
    """Get problems tagged to a specific company."""
    data = _load_company_problems()
    company_data = data.get(slug, [])
    return APIResponse(success=True, data=company_data)

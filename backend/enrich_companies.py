# Script to load enrichment data into company_blueprints JSONB columns
import asyncio
import json
from pathlib import Path
from sqlalchemy import text
from app.core.database import async_session_factory

DATA_DIR = Path(__file__).parent / "data"

async def load_enrichment_data():
    """Load all enrichment JSON files and merge them."""
    all_data = {}
    for fname in ["company_enrichment_faang.json", "company_enrichment_indian.json", "company_enrichment_others.json"]:
        fpath = DATA_DIR / fname
        if fpath.exists():
            with open(fpath, "r") as f:
                all_data.update(json.load(f))
            print(f"  Loaded {fname}: {len(json.load(open(fpath)))} companies")
    return all_data

async def enrich_companies():
    """Update company_blueprints with enrichment data (projects, resources, reviews, tips)."""
    print("\n=== Company Enrichment Script ===\n")
    
    enrichment = {}
    for fname in ["company_enrichment_faang.json", "company_enrichment_indian.json", "company_enrichment_others.json"]:
        fpath = DATA_DIR / fname
        if fpath.exists():
            with open(fpath, "r") as f:
                data = json.load(f)
                enrichment.update(data)
                print(f"  Loaded {fname}: {len(data)} companies")
    
    print(f"\n  Total companies to enrich: {len(enrichment)}\n")
    
    async with async_session_factory() as db:
        # Get all existing company slugs
        result = await db.execute(text("SELECT slug FROM company_blueprints"))
        existing_slugs = {row[0] for row in result.fetchall()}
        print(f"  Existing companies in DB: {existing_slugs}\n")
        
        updated = 0
        skipped = 0
        
        for slug, data in enrichment.items():
            if slug not in existing_slugs:
                print(f"  ⚠ Skipping '{slug}' — not found in DB")
                skipped += 1
                continue
            
            # Build the update parts
            updates = []
            params = {"slug": slug}
            
            # Update projects JSONB
            if "projects" in data:
                updates.append("projects = :projects")
                params["projects"] = json.dumps(data["projects"])
            
            # Update resources JSONB
            if "resources" in data:
                updates.append("resources = :resources")
                params["resources"] = json.dumps(data["resources"])
            
            # Merge interview_reviews, interview_stats, insider_tips, dos_donts into hiring_data
            hiring_data_updates = {}
            for key in ["interview_reviews", "interview_stats", "insider_tips", "dos_donts"]:
                if key in data:
                    hiring_data_updates[key] = data[key]
            
            if hiring_data_updates:
                # Fetch current hiring_data and merge
                r = await db.execute(text("SELECT hiring_data FROM company_blueprints WHERE slug = :slug"), {"slug": slug})
                current = r.scalar() or {}
                current.update(hiring_data_updates)
                updates.append("hiring_data = :hiring_data")
                params["hiring_data"] = json.dumps(current)
            
            if updates:
                query = f"UPDATE company_blueprints SET {', '.join(updates)}, updated_at = NOW() WHERE slug = :slug"
                await db.execute(text(query), params)
                print(f"  ✅ Updated '{slug}' — projects={bool(data.get('projects'))}, resources={bool(data.get('resources'))}, reviews={len(data.get('interview_reviews', []))}")
                updated += 1
        
        await db.commit()
        print(f"\n  Done! Updated: {updated}, Skipped: {skipped}")
        print("  =================================\n")

if __name__ == "__main__":
    asyncio.run(enrich_companies())

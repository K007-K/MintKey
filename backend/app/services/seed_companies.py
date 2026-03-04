# Company blueprint seed data — 15+ Indian tech companies
import logging
import asyncio
from app.core.database import async_session_factory
from app.models.db import CompanyBlueprint

logger = logging.getLogger(__name__)

COMPANY_BLUEPRINTS = [
    {
        "name": "Google",
        "slug": "google",
        "hiring_data": {
            "avg_package_lpa": 35,
            "hiring_months": ["Aug", "Sep", "Oct", "Jan", "Feb"],
            "roles": ["SDE", "SDE-2", "SWE Intern"],
            "locations": ["Bangalore", "Hyderabad", "Gurgaon"],
        },
        "dsa_requirements": {
            "min_problems": 300,
            "focus_topics": ["Dynamic Programming", "Graphs", "Trees", "Arrays", "Strings"],
            "difficulty_mix": {"Easy": 20, "Medium": 50, "Hard": 30},
            "contest_rating_target": 1800,
        },
        "tech_stack": ["Python", "Java", "C++", "Go", "Distributed Systems", "System Design", "Machine Learning"],
        "interview_format": {
            "rounds": ["Online Assessment", "Phone Screen", "Onsite 1 (Coding)", "Onsite 2 (Coding)", "Onsite 3 (System Design)", "Googleyness & Leadership"],
            "total_rounds": 6,
            "duration_weeks": 4,
        },
        "cgpa_cutoff": 7.0,
        "difficulty_level": "Very Hard",
        "system_design_required": True,
    },
    {
        "name": "Amazon",
        "slug": "amazon",
        "hiring_data": {
            "avg_package_lpa": 30,
            "hiring_months": ["Jul", "Aug", "Sep", "Oct", "Jan"],
            "roles": ["SDE-1", "SDE-2", "SDE Intern"],
            "locations": ["Bangalore", "Hyderabad", "Chennai"],
        },
        "dsa_requirements": {
            "min_problems": 200,
            "focus_topics": ["Arrays", "BFS/DFS", "Dynamic Programming", "Trees", "Sliding Window"],
            "difficulty_mix": {"Easy": 25, "Medium": 55, "Hard": 20},
            "contest_rating_target": 1600,
        },
        "tech_stack": ["Java", "Python", "AWS", "Distributed Systems", "System Design", "Microservices"],
        "interview_format": {
            "rounds": ["Online Assessment (2 questions)", "Phone Screen", "Onsite Loop (4 rounds)", "Bar Raiser"],
            "total_rounds": 7,
            "duration_weeks": 3,
            "leadership_principles": True,
        },
        "cgpa_cutoff": 6.5,
        "difficulty_level": "Hard",
        "system_design_required": True,
    },
    {
        "name": "Microsoft",
        "slug": "microsoft",
        "hiring_data": {
            "avg_package_lpa": 28,
            "hiring_months": ["Aug", "Sep", "Oct", "Feb", "Mar"],
            "roles": ["SDE", "SDE-2", "SWE Intern"],
            "locations": ["Hyderabad", "Bangalore", "Noida"],
        },
        "dsa_requirements": {
            "min_problems": 200,
            "focus_topics": ["Arrays", "Strings", "Trees", "LinkedList", "Dynamic Programming"],
            "difficulty_mix": {"Easy": 25, "Medium": 55, "Hard": 20},
            "contest_rating_target": 1600,
        },
        "tech_stack": ["C#", "Java", "Python", "Azure", "System Design", ".NET"],
        "interview_format": {
            "rounds": ["Online Assessment", "Group Fly Round", "Technical 1", "Technical 2", "HR + Design"],
            "total_rounds": 5,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 7.0,
        "difficulty_level": "Hard",
        "system_design_required": True,
    },
    {
        "name": "Flipkart",
        "slug": "flipkart",
        "hiring_data": {
            "avg_package_lpa": 25,
            "hiring_months": ["Aug", "Sep", "Oct"],
            "roles": ["SDE-1", "SDE-2"],
            "locations": ["Bangalore"],
        },
        "dsa_requirements": {
            "min_problems": 200,
            "focus_topics": ["Dynamic Programming", "Graphs", "System Design", "Arrays", "Trees"],
            "difficulty_mix": {"Easy": 20, "Medium": 50, "Hard": 30},
            "contest_rating_target": 1700,
        },
        "tech_stack": ["Java", "Python", "Microservices", "Kafka", "System Design", "MySQL"],
        "interview_format": {
            "rounds": ["Online Coding Test", "Machine Coding Round", "Problem Solving", "System Design", "HR"],
            "total_rounds": 5,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 7.0,
        "difficulty_level": "Hard",
        "system_design_required": True,
    },
    {
        "name": "Razorpay",
        "slug": "razorpay",
        "hiring_data": {
            "avg_package_lpa": 22,
            "hiring_months": ["Year-round"],
            "roles": ["SDE-1", "SDE-2", "Backend Engineer"],
            "locations": ["Bangalore"],
        },
        "dsa_requirements": {
            "min_problems": 150,
            "focus_topics": ["System Design", "APIs", "Database Design", "Arrays", "Trees"],
            "difficulty_mix": {"Easy": 20, "Medium": 60, "Hard": 20},
        },
        "tech_stack": ["Go", "Ruby", "Python", "PostgreSQL", "Redis", "Docker", "Kubernetes", "System Design"],
        "interview_format": {
            "rounds": ["HackerRank Test", "Technical Round 1", "Machine Coding", "System Design", "Culture Fit"],
            "total_rounds": 5,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 7.5,
        "difficulty_level": "Medium",
        "system_design_required": True,
    },
    {
        "name": "Zepto",
        "slug": "zepto",
        "hiring_data": {
            "avg_package_lpa": 25,
            "hiring_months": ["Year-round"],
            "roles": ["SDE-1", "Backend Engineer", "Full Stack"],
            "locations": ["Mumbai", "Bangalore"],
        },
        "dsa_requirements": {
            "min_problems": 150,
            "focus_topics": ["Arrays", "Trees", "System Design", "Real-time Systems"],
            "difficulty_mix": {"Easy": 25, "Medium": 55, "Hard": 20},
        },
        "tech_stack": ["Go", "Python", "React", "PostgreSQL", "Redis", "Kafka", "Kubernetes"],
        "interview_format": {
            "rounds": ["Online Test", "Technical 1", "System Design", "Culture Fit"],
            "total_rounds": 4,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 0,
        "difficulty_level": "Medium",
        "system_design_required": True,
    },
    {
        "name": "CRED",
        "slug": "cred",
        "hiring_data": {
            "avg_package_lpa": 30,
            "hiring_months": ["Year-round"],
            "roles": ["SDE-1", "SDE-2", "iOS/Android Engineer"],
            "locations": ["Bangalore"],
        },
        "dsa_requirements": {
            "min_problems": 150,
            "focus_topics": ["System Design", "Clean Code", "Design Patterns", "Trees", "Graphs"],
            "difficulty_mix": {"Easy": 20, "Medium": 60, "Hard": 20},
        },
        "tech_stack": ["Kotlin", "Swift", "Python", "Go", "PostgreSQL", "System Design", "Clean Architecture"],
        "interview_format": {
            "rounds": ["Take-home Assignment", "Code Review", "Technical Deep Dive", "System Design", "Founder Round"],
            "total_rounds": 5,
            "duration_weeks": 3,
        },
        "cgpa_cutoff": 0,
        "difficulty_level": "Hard",
        "system_design_required": True,
    },
    {
        "name": "PhonePe",
        "slug": "phonpe",
        "hiring_data": {
            "avg_package_lpa": 22,
            "hiring_months": ["Year-round"],
            "roles": ["SDE-1", "SDE-2"],
            "locations": ["Bangalore", "Pune"],
        },
        "dsa_requirements": {
            "min_problems": 200,
            "focus_topics": ["Arrays", "DP", "Trees", "Graphs", "System Design"],
            "difficulty_mix": {"Easy": 25, "Medium": 50, "Hard": 25},
        },
        "tech_stack": ["Java", "Spring Boot", "PostgreSQL", "Kafka", "System Design", "Microservices"],
        "interview_format": {
            "rounds": ["Online Test", "Technical 1", "Technical 2", "System Design", "HR"],
            "total_rounds": 5,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 6.5,
        "difficulty_level": "Hard",
        "system_design_required": True,
    },
    {
        "name": "Groww",
        "slug": "groww",
        "hiring_data": {
            "avg_package_lpa": 20,
            "hiring_months": ["Year-round"],
            "roles": ["SDE-1", "Backend Engineer", "Frontend Engineer"],
            "locations": ["Bangalore"],
        },
        "dsa_requirements": {
            "min_problems": 150,
            "focus_topics": ["Arrays", "Trees", "DP", "System Design"],
            "difficulty_mix": {"Easy": 30, "Medium": 50, "Hard": 20},
        },
        "tech_stack": ["Java", "React", "Node.js", "PostgreSQL", "Redis", "AWS"],
        "interview_format": {
            "rounds": ["Online Test", "Technical Round", "System Design", "Culture Fit"],
            "total_rounds": 4,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 6.0,
        "difficulty_level": "Medium",
        "system_design_required": True,
    },
    {
        "name": "Swiggy",
        "slug": "swiggy",
        "hiring_data": {
            "avg_package_lpa": 22,
            "hiring_months": ["Year-round"],
            "roles": ["SDE-1", "SDE-2", "Backend Engineer"],
            "locations": ["Bangalore"],
        },
        "dsa_requirements": {
            "min_problems": 200,
            "focus_topics": ["DP", "Graphs", "Trees", "Arrays", "System Design"],
            "difficulty_mix": {"Easy": 25, "Medium": 50, "Hard": 25},
        },
        "tech_stack": ["Java", "Kotlin", "Go", "PostgreSQL", "Kafka", "Docker", "Kubernetes"],
        "interview_format": {
            "rounds": ["Online Test", "Machine Coding", "Problem Solving", "System Design", "HR"],
            "total_rounds": 5,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 6.5,
        "difficulty_level": "Hard",
        "system_design_required": True,
    },
    {
        "name": "Blinkit",
        "slug": "blinkit",
        "hiring_data": {
            "avg_package_lpa": 18,
            "hiring_months": ["Year-round"],
            "roles": ["SDE-1", "Backend Engineer"],
            "locations": ["Gurgaon"],
        },
        "dsa_requirements": {
            "min_problems": 150,
            "focus_topics": ["Arrays", "DP", "System Design", "Real-time Systems"],
            "difficulty_mix": {"Easy": 30, "Medium": 50, "Hard": 20},
        },
        "tech_stack": ["Go", "Python", "React", "PostgreSQL", "Redis", "Docker"],
        "interview_format": {
            "rounds": ["Online Test", "Technical Round", "System Design", "HR"],
            "total_rounds": 4,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 0,
        "difficulty_level": "Medium",
        "system_design_required": True,
    },
    {
        "name": "Meesho",
        "slug": "meesho",
        "hiring_data": {
            "avg_package_lpa": 20,
            "hiring_months": ["Year-round"],
            "roles": ["SDE-1", "SDE-2"],
            "locations": ["Bangalore"],
        },
        "dsa_requirements": {
            "min_problems": 150,
            "focus_topics": ["Arrays", "DP", "Trees", "System Design"],
            "difficulty_mix": {"Easy": 25, "Medium": 55, "Hard": 20},
        },
        "tech_stack": ["Java", "Python", "React", "PostgreSQL", "Redis", "AWS"],
        "interview_format": {
            "rounds": ["Online Test", "Technical 1", "Technical 2", "HR"],
            "total_rounds": 4,
            "duration_weeks": 2,
        },
        "cgpa_cutoff": 6.0,
        "difficulty_level": "Medium",
        "system_design_required": True,
    },
    {
        "name": "TCS",
        "slug": "tcs",
        "hiring_data": {
            "avg_package_lpa": 7,
            "hiring_months": ["Sep", "Oct", "Nov", "Mar", "Apr"],
            "roles": ["System Engineer", "Digital", "Ninja", "Codevita Winner"],
            "locations": ["Pan India"],
        },
        "dsa_requirements": {
            "min_problems": 50,
            "focus_topics": ["Arrays", "Strings", "Sorting", "Basic DP"],
            "difficulty_mix": {"Easy": 50, "Medium": 40, "Hard": 10},
        },
        "tech_stack": ["Java", "Python", "SQL", "HTML/CSS", "JavaScript"],
        "interview_format": {
            "rounds": ["TCS NQT", "Technical Interview", "Managerial Round", "HR"],
            "total_rounds": 4,
            "duration_weeks": 1,
        },
        "cgpa_cutoff": 6.0,
        "difficulty_level": "Easy",
        "system_design_required": False,
    },
    {
        "name": "Infosys",
        "slug": "infosys",
        "hiring_data": {
            "avg_package_lpa": 6,
            "hiring_months": ["Sep", "Oct", "Mar", "Apr"],
            "roles": ["Systems Engineer", "Power Programmer", "DSE", "Specialist Programmer"],
            "locations": ["Pan India"],
        },
        "dsa_requirements": {
            "min_problems": 50,
            "focus_topics": ["Arrays", "Strings", "Sorting", "Basic Math"],
            "difficulty_mix": {"Easy": 60, "Medium": 35, "Hard": 5},
        },
        "tech_stack": ["Java", "Python", "C", "SQL", "HTML/CSS"],
        "interview_format": {
            "rounds": ["InfyTQ / HackWithInfy", "Technical Round", "HR"],
            "total_rounds": 3,
            "duration_weeks": 1,
        },
        "cgpa_cutoff": 6.0,
        "difficulty_level": "Easy",
        "system_design_required": False,
    },
    {
        "name": "Wipro",
        "slug": "wipro",
        "hiring_data": {
            "avg_package_lpa": 5,
            "hiring_months": ["Year-round campus"],
            "roles": ["Project Engineer", "Elite NLTH"],
            "locations": ["Pan India"],
        },
        "dsa_requirements": {
            "min_problems": 30,
            "focus_topics": ["Arrays", "Strings", "Sorting"],
            "difficulty_mix": {"Easy": 70, "Medium": 25, "Hard": 5},
        },
        "tech_stack": ["Java", "Python", "SQL", "HTML/CSS"],
        "interview_format": {
            "rounds": ["Online Aptitude Test", "Coding Test", "Technical + HR"],
            "total_rounds": 3,
            "duration_weeks": 1,
        },
        "cgpa_cutoff": 5.5,
        "difficulty_level": "Easy",
        "system_design_required": False,
    },
]


async def seed_company_blueprints():
    """Seed all company blueprints into the database."""
    logger.info("Seeding company blueprints...")

    async with async_session_factory() as session:
        for bp_data in COMPANY_BLUEPRINTS:
            blueprint = CompanyBlueprint(
                name=bp_data["name"],
                slug=bp_data["slug"],
                hiring_data=bp_data["hiring_data"],
                dsa_requirements=bp_data["dsa_requirements"],
                tech_stack=bp_data["tech_stack"],
                interview_format=bp_data["interview_format"],
            )
            session.add(blueprint)

        await session.commit()
        logger.info(f"Seeded {len(COMPANY_BLUEPRINTS)} company blueprints")


if __name__ == "__main__":
    asyncio.run(seed_company_blueprints())

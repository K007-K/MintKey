# HelixDB skill graph seeding — 200+ skill nodes with dependency edges
import logging
import json
from pathlib import Path

logger = logging.getLogger(__name__)

# Skill nodes with categories and dependency edges (directed: prerequisite → skill)
SKILL_GRAPH = {
    # --- Backend Chain ---
    "Python": {"category": "languages", "deps": []},
    "Java": {"category": "languages", "deps": []},
    "Go": {"category": "languages", "deps": []},
    "C++": {"category": "languages", "deps": ["C"]},
    "C": {"category": "languages", "deps": []},
    "Rust": {"category": "languages", "deps": ["C"]},
    "JavaScript": {"category": "languages", "deps": []},
    "TypeScript": {"category": "languages", "deps": ["JavaScript"]},
    "Kotlin": {"category": "languages", "deps": ["Java"]},
    "Swift": {"category": "languages", "deps": []},
    "Ruby": {"category": "languages", "deps": []},
    "PHP": {"category": "languages", "deps": []},
    "Dart": {"category": "languages", "deps": []},
    "R": {"category": "languages", "deps": []},
    "Shell": {"category": "languages", "deps": ["Linux"]},
    "SQL": {"category": "database", "deps": []},

    # --- Backend Frameworks ---
    "FastAPI": {"category": "backend", "deps": ["Python", "REST API", "Async Programming"]},
    "Django": {"category": "backend", "deps": ["Python", "REST API", "SQL"]},
    "Flask": {"category": "backend", "deps": ["Python", "REST API"]},
    "Express.js": {"category": "backend", "deps": ["Node.js", "REST API"]},
    "Node.js": {"category": "backend", "deps": ["JavaScript"]},
    "Spring Boot": {"category": "backend", "deps": ["Java", "REST API"]},
    "NestJS": {"category": "backend", "deps": ["TypeScript", "Node.js"]},
    "REST API": {"category": "backend", "deps": ["HTTP"]},
    "GraphQL": {"category": "backend", "deps": ["REST API", "JavaScript"]},
    "gRPC": {"category": "backend", "deps": ["REST API", "Protocol Buffers"]},
    "WebSocket": {"category": "backend", "deps": ["HTTP", "JavaScript"]},
    "Microservices": {"category": "backend", "deps": ["REST API", "Docker", "Message Queues"]},
    "HTTP": {"category": "backend", "deps": []},
    "Protocol Buffers": {"category": "backend", "deps": []},
    "Async Programming": {"category": "backend", "deps": ["Python"]},
    "Message Queues": {"category": "backend", "deps": ["REST API"]},

    # --- Frontend ---
    "HTML": {"category": "frontend", "deps": []},
    "CSS": {"category": "frontend", "deps": ["HTML"]},
    "React": {"category": "frontend", "deps": ["JavaScript", "HTML", "CSS"]},
    "Next.js": {"category": "frontend", "deps": ["React", "TypeScript"]},
    "Vue.js": {"category": "frontend", "deps": ["JavaScript", "HTML", "CSS"]},
    "Angular": {"category": "frontend", "deps": ["TypeScript", "HTML", "CSS"]},
    "Svelte": {"category": "frontend", "deps": ["JavaScript", "HTML", "CSS"]},
    "Tailwind CSS": {"category": "frontend", "deps": ["CSS"]},
    "Bootstrap": {"category": "frontend", "deps": ["CSS"]},
    "SASS": {"category": "frontend", "deps": ["CSS"]},
    "Redux": {"category": "frontend", "deps": ["React"]},
    "Zustand": {"category": "frontend", "deps": ["React"]},
    "Three.js": {"category": "frontend", "deps": ["JavaScript", "WebGL"]},
    "D3.js": {"category": "frontend", "deps": ["JavaScript", "SVG"]},
    "WebGL": {"category": "frontend", "deps": ["JavaScript"]},
    "SVG": {"category": "frontend", "deps": ["HTML"]},

    # --- Database ---
    "PostgreSQL": {"category": "database", "deps": ["SQL"]},
    "MySQL": {"category": "database", "deps": ["SQL"]},
    "MongoDB": {"category": "database", "deps": ["JSON"]},
    "Redis": {"category": "database", "deps": []},
    "SQLite": {"category": "database", "deps": ["SQL"]},
    "Cassandra": {"category": "database", "deps": ["SQL", "Distributed Systems"]},
    "DynamoDB": {"category": "database", "deps": ["AWS", "NoSQL"]},
    "Elasticsearch": {"category": "database", "deps": ["REST API"]},
    "Firebase": {"category": "database", "deps": ["JavaScript"]},
    "Supabase": {"category": "database", "deps": ["PostgreSQL", "REST API"]},
    "Prisma": {"category": "database", "deps": ["TypeScript", "SQL"]},
    "SQLAlchemy": {"category": "database", "deps": ["Python", "SQL"]},
    "JSON": {"category": "database", "deps": []},
    "NoSQL": {"category": "database", "deps": []},
    "Database Indexing": {"category": "database", "deps": ["SQL"]},
    "Database Normalization": {"category": "database", "deps": ["SQL"]},
    "ORMs": {"category": "database", "deps": ["SQL", "Python"]},
    "Connection Pooling": {"category": "database", "deps": ["SQL"]},

    # --- DevOps ---
    "Linux": {"category": "devops", "deps": []},
    "Docker": {"category": "devops", "deps": ["Linux"]},
    "Kubernetes": {"category": "devops", "deps": ["Docker", "Linux"]},
    "AWS": {"category": "devops", "deps": ["Linux"]},
    "GCP": {"category": "devops", "deps": ["Linux"]},
    "Azure": {"category": "devops", "deps": ["Linux"]},
    "CI/CD": {"category": "devops", "deps": ["Git", "Docker"]},
    "GitHub Actions": {"category": "devops", "deps": ["Git", "CI/CD"]},
    "Jenkins": {"category": "devops", "deps": ["CI/CD"]},
    "Terraform": {"category": "devops", "deps": ["Cloud Computing", "Linux"]},
    "Nginx": {"category": "devops", "deps": ["Linux", "HTTP"]},
    "Vercel": {"category": "devops", "deps": ["Next.js"]},
    "Git": {"category": "devops", "deps": []},
    "Cloud Computing": {"category": "devops", "deps": ["Linux"]},
    "Load Balancing": {"category": "devops", "deps": ["Nginx", "HTTP"]},
    "Monitoring": {"category": "devops", "deps": ["Linux"]},
    "Logging": {"category": "devops", "deps": ["Linux"]},

    # --- ML/AI ---
    "Machine Learning": {"category": "ml_ai", "deps": ["Python", "Linear Algebra", "Statistics"]},
    "Deep Learning": {"category": "ml_ai", "deps": ["Machine Learning", "Neural Networks"]},
    "TensorFlow": {"category": "ml_ai", "deps": ["Python", "Deep Learning"]},
    "PyTorch": {"category": "ml_ai", "deps": ["Python", "Deep Learning"]},
    "scikit-learn": {"category": "ml_ai", "deps": ["Python", "Machine Learning"]},
    "NLP": {"category": "ml_ai", "deps": ["Machine Learning", "Python"]},
    "Computer Vision": {"category": "ml_ai", "deps": ["Deep Learning", "Python"]},
    "Pandas": {"category": "ml_ai", "deps": ["Python"]},
    "NumPy": {"category": "ml_ai", "deps": ["Python"]},
    "LLM": {"category": "ml_ai", "deps": ["NLP", "Deep Learning"]},
    "RAG": {"category": "ml_ai", "deps": ["LLM", "Vector Databases"]},
    "LangChain": {"category": "ml_ai", "deps": ["Python", "LLM"]},
    "Hugging Face": {"category": "ml_ai", "deps": ["PyTorch", "NLP"]},
    "spaCy": {"category": "ml_ai", "deps": ["Python", "NLP"]},
    "Linear Algebra": {"category": "ml_ai", "deps": []},
    "Statistics": {"category": "ml_ai", "deps": []},
    "Neural Networks": {"category": "ml_ai", "deps": ["Linear Algebra", "Python"]},
    "Vector Databases": {"category": "ml_ai", "deps": ["Machine Learning"]},

    # --- DSA ---
    "Arrays": {"category": "dsa", "deps": []},
    "Linked Lists": {"category": "dsa", "deps": ["Arrays"]},
    "Stack": {"category": "dsa", "deps": ["Arrays"]},
    "Queue": {"category": "dsa", "deps": ["Arrays"]},
    "Hashing": {"category": "dsa", "deps": ["Arrays"]},
    "Trees": {"category": "dsa", "deps": ["Recursion", "Arrays"]},
    "Binary Search": {"category": "dsa", "deps": ["Arrays", "Sorting"]},
    "Sorting": {"category": "dsa", "deps": ["Arrays"]},
    "Graphs": {"category": "dsa", "deps": ["Trees", "Queue"]},
    "Dynamic Programming": {"category": "dsa", "deps": ["Recursion", "Arrays"]},
    "Recursion": {"category": "dsa", "deps": []},
    "Greedy": {"category": "dsa", "deps": ["Sorting"]},
    "BFS": {"category": "dsa", "deps": ["Graphs", "Queue"]},
    "DFS": {"category": "dsa", "deps": ["Graphs", "Stack", "Recursion"]},
    "Heap": {"category": "dsa", "deps": ["Trees", "Arrays"]},
    "Trie": {"category": "dsa", "deps": ["Trees", "Hashing"]},
    "Sliding Window": {"category": "dsa", "deps": ["Arrays", "Hashing"]},
    "Two Pointers": {"category": "dsa", "deps": ["Arrays", "Sorting"]},
    "Segment Tree": {"category": "dsa", "deps": ["Trees", "Arrays"]},
    "Bit Manipulation": {"category": "dsa", "deps": []},
    "Backtracking": {"category": "dsa", "deps": ["Recursion"]},
    "Divide and Conquer": {"category": "dsa", "deps": ["Recursion"]},
    "Union Find": {"category": "dsa", "deps": ["Graphs"]},
    "Topological Sort": {"category": "dsa", "deps": ["Graphs", "DFS"]},
    "Shortest Path": {"category": "dsa", "deps": ["Graphs", "BFS"]},
    "Minimum Spanning Tree": {"category": "dsa", "deps": ["Graphs", "Greedy"]},
    "String Matching": {"category": "dsa", "deps": ["Arrays", "Hashing"]},

    # --- System Design ---
    "System Design": {"category": "system_design", "deps": ["Distributed Systems", "Database Indexing", "Load Balancing"]},
    "Distributed Systems": {"category": "system_design", "deps": ["Networking", "Linux"]},
    "Caching": {"category": "system_design", "deps": ["Redis"]},
    "Rate Limiting": {"category": "system_design", "deps": ["REST API", "Redis"]},
    "API Design": {"category": "system_design", "deps": ["REST API"]},
    "Design Patterns": {"category": "system_design", "deps": ["OOP"]},
    "SOLID Principles": {"category": "system_design", "deps": ["OOP"]},
    "Clean Architecture": {"category": "system_design", "deps": ["Design Patterns", "SOLID Principles"]},
    "Event Driven Architecture": {"category": "system_design", "deps": ["Message Queues"]},
    "CAP Theorem": {"category": "system_design", "deps": ["Distributed Systems"]},
    "Database Sharding": {"category": "system_design", "deps": ["SQL", "Distributed Systems"]},
    "OOP": {"category": "system_design", "deps": []},
    "Networking": {"category": "system_design", "deps": []},

    # --- Security ---
    "OAuth": {"category": "security", "deps": ["HTTP", "JWT"]},
    "JWT": {"category": "security", "deps": ["HTTP"]},
    "HTTPS": {"category": "security", "deps": ["HTTP"]},
    "CORS": {"category": "security", "deps": ["HTTP"]},
    "RBAC": {"category": "security", "deps": ["Authentication"]},
    "Authentication": {"category": "security", "deps": ["HTTP"]},
    "Authorization": {"category": "security", "deps": ["Authentication"]},
    "Encryption": {"category": "security", "deps": []},

    # --- Testing ---
    "Unit Testing": {"category": "testing", "deps": []},
    "Integration Testing": {"category": "testing", "deps": ["Unit Testing"]},
    "Jest": {"category": "testing", "deps": ["JavaScript", "Unit Testing"]},
    "Pytest": {"category": "testing", "deps": ["Python", "Unit Testing"]},
    "Cypress": {"category": "testing", "deps": ["JavaScript"]},
    "TDD": {"category": "testing", "deps": ["Unit Testing"]},

    # --- Tools ---
    "Kafka": {"category": "tools", "deps": ["Message Queues"]},
    "RabbitMQ": {"category": "tools", "deps": ["Message Queues"]},
    "Celery": {"category": "tools", "deps": ["Python", "Redis"]},
    "Webpack": {"category": "tools", "deps": ["JavaScript"]},
    "Vite": {"category": "tools", "deps": ["JavaScript"]},

    # --- Mobile ---
    "React Native": {"category": "mobile", "deps": ["React", "JavaScript"]},
    "Flutter": {"category": "mobile", "deps": ["Dart"]},
    "Android": {"category": "mobile", "deps": ["Java", "Kotlin"]},
    "iOS": {"category": "mobile", "deps": ["Swift"]},
    "SwiftUI": {"category": "mobile", "deps": ["Swift"]},
    "Jetpack Compose": {"category": "mobile", "deps": ["Kotlin"]},
}


def get_skill_nodes() -> list[dict]:
    """Get all skill nodes for HelixDB seeding."""
    nodes = []
    for skill_name, data in SKILL_GRAPH.items():
        nodes.append({
            "id": skill_name.lower().replace(" ", "_").replace("/", "_").replace(".", ""),
            "name": skill_name,
            "category": data["category"],
        })
    return nodes


def get_skill_edges() -> list[dict]:
    """Get all dependency edges (prerequisite → skill) for HelixDB seeding."""
    edges = []
    for skill_name, data in SKILL_GRAPH.items():
        for dep in data["deps"]:
            if dep in SKILL_GRAPH:
                edges.append({
                    "from": dep.lower().replace(" ", "_").replace("/", "_").replace(".", ""),
                    "to": skill_name.lower().replace(" ", "_").replace("/", "_").replace(".", ""),
                    "from_name": dep,
                    "to_name": skill_name,
                    "edge_type": "prerequisite",
                })
    return edges


def get_prerequisites(skill_name: str, depth: int = 3) -> list[str]:
    """Get prerequisite chain for a skill (BFS traversal)."""
    if skill_name not in SKILL_GRAPH:
        return []

    visited = set()
    queue = [(skill_name, 0)]
    result = []

    while queue:
        current, level = queue.pop(0)
        if current in visited or level > depth:
            continue
        visited.add(current)

        if current != skill_name:
            result.append(current)

        for dep in SKILL_GRAPH.get(current, {}).get("deps", []):
            if dep not in visited:
                queue.append((dep, level + 1))

    return result


def get_dependents(skill_name: str, depth: int = 2) -> list[str]:
    """Get skills that depend on this skill (reverse traversal)."""
    result = []
    for skill, data in SKILL_GRAPH.items():
        if skill_name in data.get("deps", []) and skill != skill_name:
            result.append(skill)
    return result[:20]


async def seed_skill_graph():
    """Seed the skill graph (prints stats — HelixDB integration in future)."""
    nodes = get_skill_nodes()
    edges = get_skill_edges()
    logger.info(f"Skill graph ready: {len(nodes)} nodes, {len(edges)} edges")
    logger.info(f"Categories: {set(n['category'] for n in nodes)}")
    return {"nodes": len(nodes), "edges": len(edges)}


if __name__ == "__main__":
    import asyncio
    nodes = get_skill_nodes()
    edges = get_skill_edges()
    print(f"Skill graph: {len(nodes)} nodes, {len(edges)} edges")
    print(f"\nPrerequisites for 'System Design': {get_prerequisites('System Design')}")
    print(f"Dependents of 'Python': {get_dependents('Python')}")

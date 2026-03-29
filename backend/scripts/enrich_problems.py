# Enrich external_problems with missing data: difficulty, URL, LC number, descriptions, hints, patterns
# Run: cd backend && source .venv/bin/activate && python -m scripts.enrich_problems

import asyncio
import logging
import re
from sqlalchemy import text
from app.core.database import engine as async_engine

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ── LeetCode URL + difficulty + LC number mapping ──────────────────
# Maps slug → (lc_number, difficulty, leetcode_url)
# For problems that are missing these fields
LEETCODE_ENRICHMENT: dict[str, tuple[int | None, str, str]] = {
    # --- Top 100 most common DSA problems ---
    "two-sum": (1, "Easy", "https://leetcode.com/problems/two-sum/"),
    "add-two-numbers": (2, "Medium", "https://leetcode.com/problems/add-two-numbers/"),
    "longest-substring-without-repeating-characters": (3, "Medium", "https://leetcode.com/problems/longest-substring-without-repeating-characters/"),
    "median-of-two-sorted-arrays": (4, "Hard", "https://leetcode.com/problems/median-of-two-sorted-arrays/"),
    "longest-palindromic-substring": (5, "Medium", "https://leetcode.com/problems/longest-palindromic-substring/"),
    "reverse-integer": (7, "Medium", "https://leetcode.com/problems/reverse-integer/"),
    "palindrome-number": (9, "Easy", "https://leetcode.com/problems/palindrome-number/"),
    "container-with-most-water": (11, "Medium", "https://leetcode.com/problems/container-with-most-water/"),
    "roman-to-integer": (13, "Easy", "https://leetcode.com/problems/roman-to-integer/"),
    "longest-common-prefix": (14, "Easy", "https://leetcode.com/problems/longest-common-prefix/"),
    "3sum": (15, "Medium", "https://leetcode.com/problems/3sum/"),
    "letter-combinations-of-a-phone-number": (17, "Medium", "https://leetcode.com/problems/letter-combinations-of-a-phone-number/"),
    "4sum": (18, "Medium", "https://leetcode.com/problems/4sum/"),
    "remove-nth-node-from-end-of-list": (19, "Medium", "https://leetcode.com/problems/remove-nth-node-from-end-of-list/"),
    "valid-parentheses": (20, "Easy", "https://leetcode.com/problems/valid-parentheses/"),
    "merge-two-sorted-lists": (21, "Easy", "https://leetcode.com/problems/merge-two-sorted-lists/"),
    "generate-parentheses": (22, "Medium", "https://leetcode.com/problems/generate-parentheses/"),
    "merge-k-sorted-lists": (23, "Hard", "https://leetcode.com/problems/merge-k-sorted-lists/"),
    "swap-nodes-in-pairs": (24, "Medium", "https://leetcode.com/problems/swap-nodes-in-pairs/"),
    "reverse-nodes-in-k-group": (25, "Hard", "https://leetcode.com/problems/reverse-nodes-in-k-group/"),
    "remove-duplicates-from-sorted-array": (26, "Easy", "https://leetcode.com/problems/remove-duplicates-from-sorted-array/"),
    "next-permutation": (31, "Medium", "https://leetcode.com/problems/next-permutation/"),
    "search-in-rotated-sorted-array": (33, "Medium", "https://leetcode.com/problems/search-in-rotated-sorted-array/"),
    "find-first-and-last-position-of-element-in-sorted-array": (34, "Medium", "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/"),
    "combination-sum": (39, "Medium", "https://leetcode.com/problems/combination-sum/"),
    "combination-sum-ii": (40, "Medium", "https://leetcode.com/problems/combination-sum-ii/"),
    "trapping-rain-water": (42, "Hard", "https://leetcode.com/problems/trapping-rain-water/"),
    "permutations": (46, "Medium", "https://leetcode.com/problems/permutations/"),
    "rotate-image": (48, "Medium", "https://leetcode.com/problems/rotate-image/"),
    "group-anagrams": (49, "Medium", "https://leetcode.com/problems/group-anagrams/"),
    "maximum-subarray": (53, "Medium", "https://leetcode.com/problems/maximum-subarray/"),
    "spiral-matrix": (54, "Medium", "https://leetcode.com/problems/spiral-matrix/"),
    "jump-game": (55, "Medium", "https://leetcode.com/problems/jump-game/"),
    "merge-intervals": (56, "Medium", "https://leetcode.com/problems/merge-intervals/"),
    "unique-paths": (62, "Medium", "https://leetcode.com/problems/unique-paths/"),
    "climbing-stairs": (70, "Easy", "https://leetcode.com/problems/climbing-stairs/"),
    "edit-distance": (72, "Medium", "https://leetcode.com/problems/edit-distance/"),
    "set-matrix-zeroes": (73, "Medium", "https://leetcode.com/problems/set-matrix-zeroes/"),
    "sort-colors": (75, "Medium", "https://leetcode.com/problems/sort-colors/"),
    "minimum-window-substring": (76, "Hard", "https://leetcode.com/problems/minimum-window-substring/"),
    "subsets": (78, "Medium", "https://leetcode.com/problems/subsets/"),
    "word-search": (79, "Medium", "https://leetcode.com/problems/word-search/"),
    "largest-rectangle-in-histogram": (84, "Hard", "https://leetcode.com/problems/largest-rectangle-in-histogram/"),
    "merge-sorted-array": (88, "Easy", "https://leetcode.com/problems/merge-sorted-array/"),
    "binary-tree-inorder-traversal": (94, "Easy", "https://leetcode.com/problems/binary-tree-inorder-traversal/"),
    "validate-binary-search-tree": (98, "Medium", "https://leetcode.com/problems/validate-binary-search-tree/"),
    "same-tree": (100, "Easy", "https://leetcode.com/problems/same-tree/"),
    "symmetric-tree": (101, "Easy", "https://leetcode.com/problems/symmetric-tree/"),
    "binary-tree-level-order-traversal": (102, "Medium", "https://leetcode.com/problems/binary-tree-level-order-traversal/"),
    "maximum-depth-of-binary-tree": (104, "Easy", "https://leetcode.com/problems/maximum-depth-of-binary-tree/"),
    "construct-binary-tree-from-preorder-and-inorder-traversal": (105, "Medium", "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/"),
    "best-time-to-buy-and-sell-stock": (121, "Easy", "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"),
    "best-time-to-buy-and-sell-stock-ii": (122, "Medium", "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/"),
    "binary-tree-maximum-path-sum": (124, "Hard", "https://leetcode.com/problems/binary-tree-maximum-path-sum/"),
    "valid-palindrome": (125, "Easy", "https://leetcode.com/problems/valid-palindrome/"),
    "word-ladder": (127, "Hard", "https://leetcode.com/problems/word-ladder/"),
    "longest-consecutive-sequence": (128, "Medium", "https://leetcode.com/problems/longest-consecutive-sequence/"),
    "single-number": (136, "Easy", "https://leetcode.com/problems/single-number/"),
    "linked-list-cycle": (141, "Easy", "https://leetcode.com/problems/linked-list-cycle/"),
    "linked-list-cycle-ii": (142, "Medium", "https://leetcode.com/problems/linked-list-cycle-ii/"),
    "lru-cache": (146, "Medium", "https://leetcode.com/problems/lru-cache/"),
    "sort-list": (148, "Medium", "https://leetcode.com/problems/sort-list/"),
    "min-stack": (155, "Medium", "https://leetcode.com/problems/min-stack/"),
    "intersection-of-two-linked-lists": (160, "Easy", "https://leetcode.com/problems/intersection-of-two-linked-lists/"),
    "majority-element": (169, "Easy", "https://leetcode.com/problems/majority-element/"),
    "reverse-linked-list": (206, "Easy", "https://leetcode.com/problems/reverse-linked-list/"),
    "course-schedule": (207, "Medium", "https://leetcode.com/problems/course-schedule/"),
    "implement-trie-prefix-tree": (208, "Medium", "https://leetcode.com/problems/implement-trie-prefix-tree/"),
    "kth-largest-element-in-an-array": (215, "Medium", "https://leetcode.com/problems/kth-largest-element-in-an-array/"),
    "contains-duplicate": (217, "Easy", "https://leetcode.com/problems/contains-duplicate/"),
    "invert-binary-tree": (226, "Easy", "https://leetcode.com/problems/invert-binary-tree/"),
    "palindrome-linked-list": (234, "Easy", "https://leetcode.com/problems/palindrome-linked-list/"),
    "lowest-common-ancestor-of-a-binary-search-tree": (235, "Medium", "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/"),
    "lowest-common-ancestor-of-a-binary-tree": (236, "Medium", "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/"),
    "product-of-array-except-self": (238, "Medium", "https://leetcode.com/problems/product-of-array-except-self/"),
    "sliding-window-maximum": (239, "Hard", "https://leetcode.com/problems/sliding-window-maximum/"),
    "valid-anagram": (242, "Easy", "https://leetcode.com/problems/valid-anagram/"),
    "move-zeroes": (283, "Easy", "https://leetcode.com/problems/move-zeroes/"),
    "find-median-from-data-stream": (295, "Hard", "https://leetcode.com/problems/find-median-from-data-stream/"),
    "longest-increasing-subsequence": (300, "Medium", "https://leetcode.com/problems/longest-increasing-subsequence/"),
    "coin-change": (322, "Medium", "https://leetcode.com/problems/coin-change/"),
    "top-k-frequent-elements": (347, "Medium", "https://leetcode.com/problems/top-k-frequent-elements/"),
    "daily-temperatures": (739, "Medium", "https://leetcode.com/problems/daily-temperatures/"),
    "number-of-islands": (200, "Medium", "https://leetcode.com/problems/number-of-islands/"),
    "house-robber": (198, "Medium", "https://leetcode.com/problems/house-robber/"),
    "house-robber-ii": (213, "Medium", "https://leetcode.com/problems/house-robber-ii/"),
    "decode-ways": (91, "Medium", "https://leetcode.com/problems/decode-ways/"),
    "word-break": (139, "Medium", "https://leetcode.com/problems/word-break/"),
    "n-queens": (51, "Hard", "https://leetcode.com/problems/n-queens/"),
    "sudoku-solver": (37, "Hard", "https://leetcode.com/problems/sudoku-solver/"),
    "task-scheduler": (621, "Medium", "https://leetcode.com/problems/task-scheduler/"),
    "design-add-and-search-words-data-structure": (211, "Medium", "https://leetcode.com/problems/design-add-and-search-words-data-structure/"),
    "serialize-and-deserialize-binary-tree": (297, "Hard", "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/"),
    "kth-smallest-element-in-a-bst": (230, "Medium", "https://leetcode.com/problems/kth-smallest-element-in-a-bst/"),
    "subtree-of-another-tree": (572, "Easy", "https://leetcode.com/problems/subtree-of-another-tree/"),
    "diameter-of-binary-tree": (543, "Easy", "https://leetcode.com/problems/diameter-of-binary-tree/"),
    "pacific-atlantic-water-flow": (417, "Medium", "https://leetcode.com/problems/pacific-atlantic-water-flow/"),
    "clone-graph": (133, "Medium", "https://leetcode.com/problems/clone-graph/"),
    "graph-valid-tree": (261, "Medium", "https://leetcode.com/problems/graph-valid-tree/"),
    "alien-dictionary": (269, "Hard", "https://leetcode.com/problems/alien-dictionary/"),
    "missing-number": (268, "Easy", "https://leetcode.com/problems/missing-number/"),
    "counting-bits": (338, "Easy", "https://leetcode.com/problems/counting-bits/"),
    "reverse-bits": (190, "Easy", "https://leetcode.com/problems/reverse-bits/"),
    "number-of-1-bits": (191, "Easy", "https://leetcode.com/problems/number-of-1-bits/"),
    "encode-and-decode-strings": (271, "Medium", "https://leetcode.com/problems/encode-and-decode-strings/"),
    "meeting-rooms-ii": (253, "Medium", "https://leetcode.com/problems/meeting-rooms-ii/"),
    "non-overlapping-intervals": (435, "Medium", "https://leetcode.com/problems/non-overlapping-intervals/"),
    "insert-interval": (57, "Medium", "https://leetcode.com/problems/insert-interval/"),
    "longest-repeating-character-replacement": (424, "Medium", "https://leetcode.com/problems/longest-repeating-character-replacement/"),
    "permutation-in-string": (567, "Medium", "https://leetcode.com/problems/permutation-in-string/"),
    "two-sum-ii-input-array-is-sorted": (167, "Medium", "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/"),
    "course-schedule-ii": (210, "Medium", "https://leetcode.com/problems/course-schedule-ii/"),
    "redundant-connection": (684, "Medium", "https://leetcode.com/problems/redundant-connection/"),
    "network-delay-time": (743, "Medium", "https://leetcode.com/problems/network-delay-time/"),
    "cheapest-flights-within-k-stops": (787, "Medium", "https://leetcode.com/problems/cheapest-flights-within-k-stops/"),
    "min-cost-climbing-stairs": (746, "Easy", "https://leetcode.com/problems/min-cost-climbing-stairs/"),
    "partition-equal-subset-sum": (416, "Medium", "https://leetcode.com/problems/partition-equal-subset-sum/"),
    "target-sum": (494, "Medium", "https://leetcode.com/problems/target-sum/"),
    "interleaving-string": (97, "Medium", "https://leetcode.com/problems/interleaving-string/"),
    "distinct-subsequences": (115, "Hard", "https://leetcode.com/problems/distinct-subsequences/"),
    "burst-balloons": (312, "Hard", "https://leetcode.com/problems/burst-balloons/"),
    "regular-expression-matching": (10, "Hard", "https://leetcode.com/problems/regular-expression-matching/"),
    "maximum-product-subarray": (152, "Medium", "https://leetcode.com/problems/maximum-product-subarray/"),
    "palindromic-substrings": (647, "Medium", "https://leetcode.com/problems/palindromic-substrings/"),
    "longest-common-subsequence": (1143, "Medium", "https://leetcode.com/problems/longest-common-subsequence/"),
    "01-matrix": (542, "Medium", "https://leetcode.com/problems/01-matrix/"),
    "rotting-oranges": (994, "Medium", "https://leetcode.com/problems/rotting-oranges/"),
    "swim-in-rising-water": (778, "Hard", "https://leetcode.com/problems/swim-in-rising-water/"),
    "132-pattern": (456, "Medium", "https://leetcode.com/problems/132-pattern/"),
    "car-fleet": (853, "Medium", "https://leetcode.com/problems/car-fleet/"),
    "evaluate-reverse-polish-notation": (150, "Medium", "https://leetcode.com/problems/evaluate-reverse-polish-notation/"),
    "binary-search": (704, "Easy", "https://leetcode.com/problems/binary-search/"),
    "search-a-2d-matrix": (74, "Medium", "https://leetcode.com/problems/search-a-2d-matrix/"),
    "koko-eating-bananas": (875, "Medium", "https://leetcode.com/problems/koko-eating-bananas/"),
    "time-based-key-value-store": (981, "Medium", "https://leetcode.com/problems/time-based-key-value-store/"),
    "reorder-list": (143, "Medium", "https://leetcode.com/problems/reorder-list/"),
    "copy-list-with-random-pointer": (138, "Medium", "https://leetcode.com/problems/copy-list-with-random-pointer/"),
    "add-two-numbers": (2, "Medium", "https://leetcode.com/problems/add-two-numbers/"),
    "find-the-duplicate-number": (287, "Medium", "https://leetcode.com/problems/find-the-duplicate-number/"),
    "design-twitter": (355, "Medium", "https://leetcode.com/problems/design-twitter/"),
    "hand-of-straights": (846, "Medium", "https://leetcode.com/problems/hand-of-straights/"),
    "subsets-ii": (90, "Medium", "https://leetcode.com/problems/subsets-ii/"),
    "palindrome-partitioning": (131, "Medium", "https://leetcode.com/problems/palindrome-partitioning/"),
    "reconstruct-itinerary": (332, "Hard", "https://leetcode.com/problems/reconstruct-itinerary/"),
    "min-cost-to-connect-all-points": (1584, "Medium", "https://leetcode.com/problems/min-cost-to-connect-all-points/"),
    "accounts-merge": (721, "Medium", "https://leetcode.com/problems/accounts-merge/"),
    "surrounded-regions": (130, "Medium", "https://leetcode.com/problems/surrounded-regions/"),
    "walls-and-gates": (286, "Medium", "https://leetcode.com/problems/walls-and-gates/"),
    "word-ladder-ii": (126, "Hard", "https://leetcode.com/problems/word-ladder-ii/"),
}

# ── Pattern & difficulty inference from tags ──────────────────
TAG_TO_PATTERN: dict[str, str] = {
    "arrays": "arrays_hashing", "array": "arrays_hashing", "hashing": "arrays_hashing",
    "hash table": "arrays_hashing", "hash map": "arrays_hashing",
    "two pointers": "two_pointers", "two-pointers": "two_pointers",
    "sliding window": "sliding_window",
    "stack": "stack", "monotonic stack": "stack",
    "binary search": "binary_search",
    "linked list": "linked_list",
    "trees": "trees", "binary tree": "trees", "binary search tree": "trees",
    "binary trees": "trees", "bst": "trees",
    "heap": "heap", "priority queue": "heap", "heap / priority queue": "heap",
    "graphs": "graphs", "graph": "graphs", "bfs": "graphs", "dfs": "graphs",
    "graph algorithms": "graphs",
    "dynamic programming": "dynamic_programming", "dp": "dynamic_programming",
    "1-d dynamic programming": "dynamic_programming",
    "2-d dynamic programming": "dynamic_programming",
    "backtracking": "backtracking", "recursion": "backtracking",
    "greedy": "greedy",
    "bit manipulation": "bit_manipulation",
    "math": "math_geometry", "math & geometry": "math_geometry",
    "trie": "trie", "tries": "trie",
    "intervals": "intervals",
    "string": "strings", "strings": "strings",
    "sorting": "sorting", "sort": "sorting",
    "divide and conquer": "divide_and_conquer",
    "union find": "union_find",
    "topological sort": "graphs",
}

# ── Difficulty inference by problem name patterns ─────────────
HARD_KEYWORDS = [
    "trapping rain", "median of two", "merge k sorted", "n-queens",
    "sudoku solver", "word ladder", "alien dictionary", "serialize and deserialize",
    "binary tree maximum path", "find median from data stream", "burst balloons",
    "regular expression", "sliding window maximum", "largest rectangle in histogram",
    "minimum window substring", "word search ii", "critical connections",
    "longest valid parentheses",
]

EASY_KEYWORDS = [
    "two sum", "valid parentheses", "merge two sorted", "reverse linked list",
    "best time to buy and sell stock", "valid palindrome", "valid anagram",
    "single number", "climbing stairs", "contains duplicate", "maximum depth",
    "invert binary tree", "missing number", "palindrome number", "roman to integer",
    "binary search", "counting bits", "reverse bits", "number of 1 bits",
    "subtree of another", "diameter of binary", "same tree", "symmetric tree",
    "majority element", "move zeroes", "linked list cycle", "min cost climbing stairs",
    "intersection of two linked", "palindrome linked list", "merge sorted array",
    "longest common prefix",
]


def infer_difficulty(title: str, tags: list[str] | None) -> str:
    """Infer difficulty from title keywords."""
    lower_title = title.lower()
    for kw in HARD_KEYWORDS:
        if kw in lower_title:
            return "Hard"
    for kw in EASY_KEYWORDS:
        if kw in lower_title:
            return "Easy"
    return "Medium"  # Default -- most DSA problems are medium


def infer_pattern(tags: list[str] | None) -> str | None:
    """Infer pattern from existing tags."""
    if not tags:
        return None
    for tag in tags:
        pattern = TAG_TO_PATTERN.get(tag.lower())
        if pattern:
            return pattern
    return None


def generate_leetcode_url(title: str, slug: str | None) -> str | None:
    """Try to generate a LeetCode URL from slug."""
    if slug:
        clean = slug.lower().strip()
        return f"https://leetcode.com/problems/{clean}/"
    # Generate from title
    clean = re.sub(r"[^a-zA-Z0-9\s-]", "", title.lower())
    clean = re.sub(r"\s+", "-", clean.strip())
    if clean:
        return f"https://leetcode.com/problems/{clean}/"
    return None


async def enrich_problems():
    """Main enrichment logic — update NULL fields in external_problems."""
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker

    async_session = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Fetch all problems
        result = await session.execute(text("SELECT id, title, slug, difficulty, url, tags, pattern, lc_number FROM external_problems"))
        problems = result.fetchall()
        logger.info(f"Total problems: {len(problems)}")

        updated = 0
        for row in problems:
            pid, title, slug, difficulty, url, tags, pattern, lc_number = row
            updates: dict[str, object] = {}

            # 1. Fix difficulty using enrichment map or inference
            if not difficulty:
                slug_lower = (slug or "").lower()
                if slug_lower in LEETCODE_ENRICHMENT:
                    updates["difficulty"] = LEETCODE_ENRICHMENT[slug_lower][1]
                else:
                    updates["difficulty"] = infer_difficulty(title, tags)

            # 2. Fix URL
            if not url:
                slug_lower = (slug or "").lower()
                if slug_lower in LEETCODE_ENRICHMENT:
                    updates["url"] = LEETCODE_ENRICHMENT[slug_lower][2]
                else:
                    generated = generate_leetcode_url(title, slug)
                    if generated:
                        updates["url"] = generated

            # 3. Fix LC number
            if not lc_number:
                slug_lower = (slug or "").lower()
                if slug_lower in LEETCODE_ENRICHMENT and LEETCODE_ENRICHMENT[slug_lower][0]:
                    updates["lc_number"] = LEETCODE_ENRICHMENT[slug_lower][0]

            # 4. Fix pattern
            if not pattern:
                inferred = infer_pattern(tags)
                if inferred:
                    updates["pattern"] = inferred

            if updates:
                set_clauses = ", ".join(f"{k} = :{k}" for k in updates)
                updates["pid"] = pid
                await session.execute(
                    text(f"UPDATE external_problems SET {set_clauses}, updated_at = NOW() WHERE id = :pid"),
                    updates,
                )
                updated += 1

        await session.commit()
        logger.info(f"Updated {updated} problems")

        # Print summary
        result = await session.execute(text("""
            SELECT
                COUNT(*) as total,
                COUNT(difficulty) as has_diff,
                COUNT(url) as has_url,
                COUNT(lc_number) as has_lc,
                COUNT(pattern) as has_pattern
            FROM external_problems
        """))
        row = result.fetchone()
        logger.info(f"After enrichment: total={row[0]}, has_diff={row[1]}, has_url={row[2]}, has_lc={row[3]}, has_pattern={row[4]}")


if __name__ == "__main__":
    asyncio.run(enrich_problems())

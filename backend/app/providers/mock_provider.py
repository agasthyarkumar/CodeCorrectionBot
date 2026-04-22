import logging
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("dsa_chatbot")

_BANNER = "> **[MOCK MODE]** — No `LLM_API_KEY` is configured. Set it in `backend/.env` to get real AI responses.\n\n---\n\n"

# ── Explain ───────────────────────────────────────────────────────────────────

_EXPLAIN = {
    "binary search": _BANNER + """\
## Binary Search

### Definition
Binary search is an algorithm that locates a target value in a **sorted array** by repeatedly cutting the search space in half.

### Intuition
Think of finding a word in a physical dictionary. You open to the middle — if your word comes before that page, you discard the right half; if it comes after, you discard the left half. You never read the whole book.

### How It Works
1. Set `lo = 0`, `hi = len(array) - 1`.
2. Compute `mid = lo + (hi - lo) // 2` (avoids integer overflow vs `(lo+hi)//2`).
3. If `array[mid] == target` → found, return `mid`.
4. If `array[mid] < target` → target is in the right half, set `lo = mid + 1`.
5. If `array[mid] > target` → target is in the left half, set `hi = mid - 1`.
6. Repeat until `lo > hi` (not found).

### Concrete Example
Array: `[2, 5, 8, 12, 16, 23, 38, 56]`, target = `23`

| Step | lo | hi | mid | array[mid] | Action |
|------|----|----|-----|------------|--------|
| 1 | 0 | 7 | 3 | 12 | 12 < 23 → lo = 4 |
| 2 | 4 | 7 | 5 | 23 | **Found!** |

```python
def binary_search(arr: list[int], target: int) -> int:
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

### Complexity Analysis
| Case | Time | Space |
|------|------|-------|
| Best | O(1) | O(1) |
| Average | O(log n) | O(1) |
| Worst | O(log n) | O(1) |

Each iteration eliminates half the remaining elements, giving log₂(n) iterations.

### When To Use
- Sorted array / list problems
- "Find first/last occurrence of X"
- "Search in rotated sorted array"
- Whenever the problem says **sorted** and asks for a position or existence check
""",

    "two pointers": _BANNER + """\
## Two Pointers

### Definition
Two pointers is a technique that uses two index variables moving through an array (or string) — either towards each other or in the same direction — to solve problems in O(n) instead of O(n²).

### Intuition
Imagine two runners on a track: one starting at the beginning, one at the end. Depending on some condition you move one runner forward and the other backward until they meet. You cover the whole track in one pass.

### How It Works — Opposite ends (e.g., pair sum)
```python
def two_sum_sorted(arr: list[int], target: int) -> tuple[int, int]:
    lo, hi = 0, len(arr) - 1
    while lo < hi:
        s = arr[lo] + arr[hi]
        if s == target:
            return lo, hi
        elif s < target:
            lo += 1   # need a bigger sum
        else:
            hi -= 1   # need a smaller sum
    return -1, -1
```

### Complexity Analysis
| Case | Time | Space |
|------|------|-------|
| Best | O(1) | O(1) |
| Average / Worst | O(n) | O(1) |

### When To Use
- Pair / triplet sum problems on **sorted** arrays
- Palindrome checking
- Container with most water
- Merging two sorted arrays
""",

    "sliding window": _BANNER + """\
## Sliding Window

### Definition
Sliding window maintains a contiguous subarray (the "window") and expands or shrinks it to satisfy a constraint — avoiding the O(n²) cost of checking every subarray.

### Intuition
Picture a camera frame sliding across a filmstrip. You extend the right edge to include new frames, and retract the left edge when the scene violates a rule (e.g., too bright). You see every valid scene without rewatching from scratch.

### How It Works — Variable-size window
```python
def longest_subarray_no_repeats(s: str) -> int:
    seen = {}
    lo = max_len = 0
    for hi, ch in enumerate(s):
        if ch in seen and seen[ch] >= lo:
            lo = seen[ch] + 1      # shrink: jump past the duplicate
        seen[ch] = hi
        max_len = max(max_len, hi - lo + 1)
    return max_len
```

### Complexity Analysis
| Case | Time | Space |
|------|------|-------|
| All | O(n) | O(k) where k = window size |

### When To Use
- "Longest / shortest subarray/substring satisfying X"
- Fixed-size subarray problems (max sum of k elements)
- Problems mentioning **contiguous** elements
""",
}

# ── Greetings & redirects ─────────────────────────────────────────────────────

_GREETING_WORDS = {
    "hi", "hello", "hey", "hiya", "howdy", "yo", "sup",
    "greetings", "morning", "evening", "afternoon",
}

_GREETING_RESPONSES = [
    "Hey! What DSA topic or problem can I help you with today?",
    "Hello! Ready to tackle some data structures and algorithms — what are you working on?",
    "Hi there! Are you looking to **explain** a concept, **generate** a problem, **fix** some code, or get a **hint**?",
]

_REDIRECT_RESPONSES = [
    "That's interesting! What DSA concept or problem can I help you with?",
    "I'm best at helping with data structures and algorithms. Try asking me to explain a topic, generate a practice problem, review your code, or give you a hint.",
    "Not sure I follow — but I'm here for all things DSA! What would you like to explore?",
]

_REDIRECT_INDEX = 0
_GREETING_INDEX = 0

# ── Generate ──────────────────────────────────────────────────────────────────

_GENERATE = [
    _BANNER + """\
## Maximum Sum Subarray of Size K

**Difficulty:** Easy

### Problem Statement
Given an integer array `nums` and a positive integer `k`, return the maximum sum of any contiguous subarray of length exactly `k`.

### Constraints
- `1 ≤ k ≤ n ≤ 10⁵`
- `-10⁴ ≤ nums[i] ≤ 10⁴`

### Input Format
- Line 1: space-separated integers (the array)
- Line 2: integer `k`

### Output Format
A single integer — the maximum subarray sum.

### Examples

**Example 1:**
```
Input:  2 1 5 1 3 2   k=3
Output: 9
```
**Explanation:** Subarray `[5, 1, 3]` has sum 9.

**Example 2:**
```
Input:  2 3 4 1 5   k=2
Output: 7
```
**Explanation:** Subarray `[3, 4]` has sum 7.

### Hint
Think about what changes between two adjacent windows of size `k` — you only add one element and remove one.
""",
    _BANNER + """\
## Two Sum

**Difficulty:** Easy

### Problem Statement
Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`. You may assume exactly one valid answer exists and you may not use the same element twice.

### Constraints
- `2 ≤ n ≤ 10⁴`
- `-10⁹ ≤ nums[i] ≤ 10⁹`
- Exactly one valid answer exists.

### Input Format
Line 1: space-separated integers
Line 2: integer `target`

### Output Format
Two space-separated integers — the 0-based indices.

### Examples

**Example 1:**
```
Input:  2 7 11 15   target=9
Output: 0 1
```
**Explanation:** `nums[0] + nums[1] = 2 + 7 = 9`.

**Example 2:**
```
Input:  3 2 4   target=6
Output: 1 2
```

### Hint
For each element, what would you need to look up instantly to find its complement?
""",
]

# ── Fix ───────────────────────────────────────────────────────────────────────

_FIX_DEFAULT = _BANNER + """\
## Code Review

*(Mock analysis — add `LLM_API_KEY` for a real review of your specific code.)*

### Common Bug Patterns to Check
1. **Off-by-one errors** — loop bounds use `<` vs `<=`, array indices ±1
2. **Missing base cases** — recursion with no termination condition
3. **Integer overflow** — `mid = (lo + hi) // 2` overflows; prefer `lo + (hi - lo) // 2`
4. **Mutating a list while iterating** — use a copy or iterate in reverse
5. **Incorrect initialisation** — `max_val = 0` fails for all-negative arrays; use `float('-inf')`

### Fixed Code
```python
# Paste your code and set LLM_API_KEY to get a specific fix here.
```

### Complexity Analysis
- **Time Complexity:** Depends on your algorithm
- **Space Complexity:** Depends on auxiliary data structures used

### Next Steps
Add `LLM_API_KEY` to `backend/.env` and re-submit with your code pasted in the code box.
"""

# ── Hint ──────────────────────────────────────────────────────────────────────

_HINT_DEFAULT = _BANNER + """\
## Hint

*(Mock hint — add `LLM_API_KEY` for a personalised Socratic nudge.)*

### Where You Are
You've identified the problem and are trying to figure out the approach — that's the hardest part.

### Questions to Ask Yourself
1. Can you solve a **smaller version** of this problem by hand? What pattern do you notice?
2. What information do you need to **remember** as you scan through the input? What data structure holds that efficiently?
3. Is there a way to avoid recomputing work you've already done?

### Nudge
Most array problems either benefit from sorting first, or from a single pass where you maintain a running summary (a count, a sum, a set of seen values).

### Smallest Next Step
Write a brute-force O(n²) solution first — getting the right answer slowly is more valuable than the wrong answer quickly.
"""

# ── Provider ──────────────────────────────────────────────────────────────────

class MockProvider(BaseLLMProvider):
    _generate_index = 0
    _greeting_index = 0
    _redirect_index = 0

    async def generate(self, prompt: str, mode: str) -> str:
        logger.warning(
            "MockProvider serving response for mode=%s — LLM_API_KEY is not configured.",
            mode,
        )

        user_msg = self._extract_user_message(prompt).lower().strip()

        # Greetings take priority in any mode
        if self._is_greeting(user_msg):
            return self._next_greeting()

        if mode == "explain":
            for keyword, response in _EXPLAIN.items():
                if keyword in user_msg:
                    return response
            # Unknown topic — short redirect instead of big generic template
            return self._next_redirect()

        if mode == "generate":
            idx = MockProvider._generate_index % len(_GENERATE)
            MockProvider._generate_index += 1
            return _GENERATE[idx]

        if mode == "fix":
            return _FIX_DEFAULT

        if mode == "hint":
            return _HINT_DEFAULT

        return self._next_redirect()

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _is_greeting(text: str) -> bool:
        words = set(text.strip("!.,?¡ ").split())
        return bool(words & _GREETING_WORDS) and len(words) <= 5

    def _next_greeting(self) -> str:
        resp = _GREETING_RESPONSES[MockProvider._greeting_index % len(_GREETING_RESPONSES)]
        MockProvider._greeting_index += 1
        return resp

    def _next_redirect(self) -> str:
        resp = _REDIRECT_RESPONSES[MockProvider._redirect_index % len(_REDIRECT_RESPONSES)]
        MockProvider._redirect_index += 1
        return resp

    @staticmethod
    def _extract_user_message(prompt: str) -> str:
        for line in prompt.splitlines():
            for tag in ("**Topic:**", "**Request:**", "**Issue reported:**", "**What the user is stuck on:**"):
                if tag in line:
                    return line.split(tag)[-1].strip()
        return prompt

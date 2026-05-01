"""Light safety filter. We don't try to be a clinical-grade content filter
here — we strip clearly unsafe phrasing (specific lethal doses, encouragement
of self-administered procedures) and add a vet disclaimer."""
from __future__ import annotations
import re

DISCLAIMER = (
    "This is general information, not a substitute for professional veterinary advice. "
    "For urgent symptoms, contact a veterinarian immediately."
)

# Patterns that suggest the LLM is giving definitive dosing or surgical instructions.
UNSAFE_PATTERNS = [
    re.compile(r"\bgive\s+\d+(\.\d+)?\s*(mg|mcg|ml|cc|tablets?|pills?)\s+(per|/)\s*kg\b", re.I),
    re.compile(r"\bperform\s+(surgery|the\s+procedure)\b", re.I),
    re.compile(r"\beuthani[sz]e\b", re.I),
]


def sanitize(answer: str) -> tuple[str, bool]:
    """Returns (sanitized_answer, safe_flag)."""
    safe = True
    for p in UNSAFE_PATTERNS:
        if p.search(answer):
            safe = False
            answer = p.sub("[redacted — please confirm with a veterinarian]", answer)
    return answer, safe


def with_disclaimer(answer: str) -> str:
    if DISCLAIMER.lower() in answer.lower():
        return answer
    return f"{answer}\n\n{DISCLAIMER}"

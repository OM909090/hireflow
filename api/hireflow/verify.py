"""
Evidence verification.

This module is the product thesis in code: the model *proposes* evidence, and
this file decides whether that evidence is real. It contains no LLM call and
never will. If a quote cannot be located in the source document, the dependent
finding degrades to `unverified` — the model is not given the final say on
whether its own evidence exists.

Naive `quote in document` fails constantly in practice, which would flag valid
evidence as unverified and be worse than having no check at all. The failure
modes handled here:

  whitespace     PDF/Markdown wraps a phrase across lines
  hyphenation    "micro-\\nservices" vs "microservices"
  ligatures      U+FB01 "ﬁ" vs "fi"  (handled by NFKC)
  punctuation    "5 years" vs "5+ years."
  smart quotes   "don't" vs "don't"
  paraphrase     model tightens wording slightly

Strategy is a ladder, cheapest first:
  1. exact match on normalised text
  2. token-subsequence match (handles interior punctuation drift)
  3. token coverage >= threshold (handles light paraphrase)
  4. otherwise: not verified
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from enum import Enum

# Coverage required for the fuzziest tier to still count as located.
COVERAGE_THRESHOLD = 0.90

# Quotes shorter than this are too weak to prove anything, even if they match.
MIN_TOKENS = 4


class Method(str, Enum):
    EXACT = "exact"
    SUBSEQUENCE = "subsequence"
    COVERAGE = "coverage"
    TOO_SHORT = "too_short"
    NOT_FOUND = "not_found"
    EMPTY = "empty"


@dataclass(frozen=True)
class VerificationResult:
    verified: bool
    method: Method
    #: Fraction of quote tokens found in the document, 0..1.
    coverage: float
    #: Human-readable explanation, surfaced in the audit trail.
    detail: str


_DEHYPHEN = re.compile(r"-\s*\n\s*")
_WS = re.compile(r"\s+")
_KEEP = re.compile(r"[^a-z0-9 ]")


def normalise(text: str) -> str:
    """
    Aggressive normalisation for comparison only — never for display.

    NFKC folds ligatures and full-width forms. Hyphen-newline pairs are joined
    before whitespace collapses, so line-broken words survive. Everything that
    is not a lowercase alphanumeric or a space is then dropped, which removes
    smart quotes, trailing full stops and the "+" in "5+ years".
    """
    t = unicodedata.normalize("NFKC", text)
    t = t.replace("\u00ad", "")  # soft hyphen
    t = _DEHYPHEN.sub("", t)  # join words broken across lines
    t = t.lower()
    t = _KEEP.sub(" ", t)
    return _WS.sub(" ", t).strip()


def tokens(text: str) -> list[str]:
    n = normalise(text)
    return n.split() if n else []


def _is_subsequence_run(needle: list[str], haystack: list[str]) -> bool:
    """
    True if every needle token appears in haystack in order, allowing gaps.

    Catches cases where normalisation left a stray token in the middle, e.g. the
    source has "Senior Backend Engineer, Kaleidofin" and the quote omits the
    comma-separated employer.
    """
    if not needle:
        return False
    i = 0
    for tok in haystack:
        if tok == needle[i]:
            i += 1
            if i == len(needle):
                return True
    return False


def _coverage(needle: list[str], haystack: list[str]) -> float:
    if not needle:
        return 0.0
    pool = set(haystack)
    hits = sum(1 for t in needle if t in pool)
    return hits / len(needle)


def verify_quote(quote: str | None, document: str) -> VerificationResult:
    """
    Decide whether `quote` is genuinely present in `document`.

    Returns a result rather than a bare bool so the audit trail can record *how*
    the match was made — an exact hit and a 0.91-coverage fuzzy hit are not the
    same claim, and a recruiter is entitled to know which one they are looking at.
    """
    if not quote or not quote.strip():
        return VerificationResult(False, Method.EMPTY, 0.0, "No quote supplied.")

    q_tokens = tokens(quote)
    if len(q_tokens) < MIN_TOKENS:
        return VerificationResult(
            False,
            Method.TOO_SHORT,
            0.0,
            f"Quote is only {len(q_tokens)} word(s); too short to evidence a requirement.",
        )

    doc_norm = normalise(document)
    q_norm = " ".join(q_tokens)

    # 1 — exact, on normalised text
    if q_norm in doc_norm:
        return VerificationResult(
            True, Method.EXACT, 1.0, "Quote located verbatim in the source document."
        )

    d_tokens = doc_norm.split()

    # 2 — ordered subsequence
    if _is_subsequence_run(q_tokens, d_tokens):
        return VerificationResult(
            True,
            Method.SUBSEQUENCE,
            1.0,
            "All quoted words located in order in the source document.",
        )

    # 3 — token coverage
    cov = _coverage(q_tokens, d_tokens)
    if cov >= COVERAGE_THRESHOLD:
        return VerificationResult(
            True,
            Method.COVERAGE,
            cov,
            f"{cov:.0%} of quoted words located in the source document.",
        )

    return VerificationResult(
        False,
        Method.NOT_FOUND,
        cov,
        f"Quote could not be located in the source document "
        f"(only {cov:.0%} of its words appear).",
    )

"""
Tests for the verifier.

These exist because the verifier is the one component whose failure is silent and
catastrophic: a false negative flags real evidence as unverified and makes the
product look broken, while a false positive lets a hallucinated quote through and
destroys the entire premise. Both directions are tested.
"""

from hireflow.verify import Method, normalise, verify_quote

DOC = """Priya Sharma — Senior Backend Engineer

Experience
Senior Backend Engineer, Kaleidofin — 2021 to 2026.
Built and owned twelve FastAPI services handling roughly 4M requests per
day in production. Containerised micro-
services using Docker and Docker Compose for local and staging environments.
Designed the PostgreSQL schema for the collections ledger and cut p99 query
latency from 840ms to 96ms.
Mentored three junior engineers.

Skills: Python, FastAPI, PostgreSQL, Redis, Docker, Celery, AWS
"""


def ok(quote: str):
    return verify_quote(quote, DOC)


# ── should verify ─────────────────────────────────────────────────────────────


def test_exact_match():
    r = ok("Mentored three junior engineers")
    assert r.verified and r.method is Method.EXACT


def test_quote_wrapped_across_lines():
    """The source wraps this across a newline; the model returns it flat."""
    r = ok("handling roughly 4M requests per day in production")
    assert r.verified, r.detail


def test_hyphenated_word_split_across_lines():
    """Source has 'micro-\\nservices'; model returns 'microservices'."""
    r = ok("Containerised microservices using Docker")
    assert r.verified, r.detail


def test_trailing_punctuation_and_case():
    r = ok("mentored THREE junior engineers.")
    assert r.verified, r.detail


def test_ligature_is_folded():
    """
    A PDF extractor can emit U+FB01 'ﬁ' instead of 'fi'. NFKC must fold it so
    'Kaleidofin' still matches. Quote is kept long enough to clear MIN_TOKENS.
    """
    quote = "Senior Backend Engineer, Kaleidofin — 2021 to 2026".replace(
        "fi", "\ufb01"
    )
    assert "\ufb01" in quote, "test setup: no ligature was actually substituted"
    r = ok(quote)
    assert r.verified, r.detail


def test_smart_apostrophe_and_dashes():
    r = ok("Senior Backend Engineer, Kaleidofin \u2014 2021 to 2026")
    assert r.verified, r.detail


def test_light_paraphrase_passes_on_coverage():
    """One drifted word out of many should still clear the coverage bar."""
    r = ok(
        "Designed the PostgreSQL schema for the collections ledger and cut p99 "
        "query latency from 840ms to 96ms"
    )
    assert r.verified, r.detail


# ── should NOT verify ─────────────────────────────────────────────────────────


def test_fabricated_quote_is_rejected():
    """The exact failure mode the product exists to prevent."""
    r = ok("Operated production Kubernetes clusters using Helm and EKS")
    assert not r.verified
    assert r.method is Method.NOT_FOUND


def test_plausible_but_absent_claim_is_rejected():
    r = ok("Led the migration to Kubernetes across forty services")
    assert not r.verified, r.detail


def test_empty_quote_is_rejected():
    assert not ok("").verified
    assert not ok(None).verified


def test_too_short_quote_is_rejected():
    """'Docker' appears in the doc but proves nothing on its own."""
    r = ok("Docker")
    assert not r.verified
    assert r.method is Method.TOO_SHORT


def test_keyword_soup_is_rejected():
    """
    Individually present words assembled into a claim the document never makes.
    Coverage alone would pass this, which is why order matters for short spans.
    """
    r = ok("Kubernetes Kubernetes Kubernetes orchestration production cluster")
    assert not r.verified, r.detail


# ── normalisation ─────────────────────────────────────────────────────────────


def test_normalise_collapses_and_strips():
    assert normalise("  Hello,   WORLD!  ") == "hello world"


def test_normalise_joins_hyphen_linebreak():
    assert normalise("micro-\nservices") == "microservices"


def test_normalise_folds_plus_sign():
    assert normalise("5+ years") == normalise("5 years")

"""
CLI entrypoint.

    uv run python -m hireflow.run              # full run, writes api/out/run.json
    uv run python -m hireflow.run --graph      # print the Mermaid graph only

The run artifact is written to disk rather than served live because each model
call costs ~32 s on this proxy. The UI reads the artifact, so the demo never
waits on inference — and the artifact is real model output, not fixtures.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
import time
from pathlib import Path

from .config import OUT_DIR, load_settings
from .graph import build_graph, run_screening


def print_graph() -> None:
    """LangGraph renders its own topology — used for the demo and the write-up."""
    g = build_graph()
    try:
        print(g.get_graph().draw_mermaid())
    except Exception as exc:  # pragma: no cover - depends on optional extras
        print(f"# could not render mermaid: {exc}", file=sys.stderr)
        print(g.get_graph())


async def main_async(args: argparse.Namespace) -> int:
    settings = load_settings()
    if not settings.is_configured:
        print(
            "HIREFLOW_API_KEY / HIREFLOW_BASE_URL are not set. "
            "Copy api/.env.example to api/.env and fill them in.",
            file=sys.stderr,
        )
        return 2

    print(f"model      : {settings.model}")
    print(f"endpoint   : {settings.base_url}")
    print(f"concurrency: {settings.max_concurrency}")
    print("running…", flush=True)

    t0 = time.monotonic()
    run = await run_screening(settings)
    elapsed = time.monotonic() - t0

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / "run.json"
    out.write_text(json.dumps(run.to_ui(), indent=2), encoding="utf-8")

    # Also drop it where the Next app can import it directly.
    web_data = Path(__file__).resolve().parents[2] / "web" / "src" / "data"
    web_data.mkdir(parents=True, exist_ok=True)
    (web_data / "run.json").write_text(
        json.dumps(run.to_ui(), indent=2), encoding="utf-8"
    )

    counts: dict[str, int] = {}
    for f in run.findings:
        counts[f.status] = counts.get(f.status, 0) + 1
    verified_spans = sum(
        1 for f in run.findings for e in f.evidence if e.verified
    )
    refused_spans = sum(
        1 for f in run.findings for e in f.evidence if not e.verified
    )

    print(f"\ndone in {elapsed:.1f}s")
    print(f"  requirements     {len(run.requirements)}")
    print(f"  candidates       {len(run.candidates)}")
    print(f"  findings         {len(run.findings)}  {counts}")
    print(f"  quotes verified  {verified_spans}")
    print(f"  quotes refused   {refused_spans}")
    print(f"  questions        {len(run.questions)}")
    print(f"  activity events  {len(run.activity)}")
    print(f"\nwrote {out}")
    print(f"wrote {web_data / 'run.json'}")
    return 0


def main() -> int:
    logging.basicConfig(
        level=logging.INFO, format="%(levelname)s %(name)s: %(message)s"
    )
    ap = argparse.ArgumentParser(prog="hireflow.run")
    ap.add_argument(
        "--graph", action="store_true", help="print the Mermaid graph and exit"
    )
    args = ap.parse_args()

    if args.graph:
        print_graph()
        return 0
    return asyncio.run(main_async(args))


if __name__ == "__main__":
    raise SystemExit(main())

"""Runtime configuration, loaded from api/.env (never committed)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

API_DIR = Path(__file__).resolve().parent.parent
FIXTURES = Path(__file__).resolve().parent / "fixtures"
OUT_DIR = API_DIR / "out"

# override=True is deliberate. api/.env is this app's source of truth, and a
# stale exported variable in the calling shell should not silently win — that
# failure mode cost real debugging time (a leaked HIREFLOW_MODEL pointed at a
# model this proxy has no credentials for, producing a confusing 404).
load_dotenv(API_DIR / ".env", override=True)


@dataclass(frozen=True)
class Settings:
    api_key: str
    base_url: str
    model: str
    #: The proxy takes 30–35 s per call regardless of payload size, so the
    #: timeout is generous and concurrency does the heavy lifting instead.
    timeout: float = 240.0
    max_concurrency: int = 6

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.base_url)


def load_settings() -> Settings:
    base = os.getenv("HIREFLOW_BASE_URL", "http://127.0.0.1:20128/v1").rstrip("/")

    # `localhost` resolves to ::1 first on this machine and the proxy only binds
    # IPv4, which manifests as a hang rather than a refusal. Rewrite defensively.
    base = base.replace("//localhost:", "//127.0.0.1:")

    return Settings(
        api_key=os.getenv("HIREFLOW_API_KEY", ""),
        base_url=base,
        model=os.getenv("HIREFLOW_MODEL", "kr/claude-haiku-4.5"),
    )

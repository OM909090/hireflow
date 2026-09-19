"""
LLM client for an OpenAI-compatible proxy that does not support structured outputs.

See api/NOTES.md for the probe results this is built around. Three things matter:

  * `stream: false` must be sent explicitly or the endpoint returns SSE.
  * `response_format` / `json_schema` is silently ignored, so JSON is enforced by
    system prompt plus tolerant parsing plus one repair retry.
  * Each call costs 30–35 s regardless of size, so callers batch aggressively and
    run concurrently. This module stays dumb; the graph decides the batching.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from .config import Settings

log = logging.getLogger("hireflow.llm")

T = TypeVar("T", bound=BaseModel)

JSON_SYSTEM = (
    "You are a JSON API inside an automated pipeline. "
    "You reply with a single raw JSON object and nothing else. "
    "No prose, no explanation, no markdown code fences, no questions, no preamble. "
    "Never ask for clarification. If information is missing, express that inside "
    "the JSON using the fields provided. Your entire response must parse as JSON."
)


class LLMError(RuntimeError):
    pass


def extract_json(text: str) -> dict[str, Any]:
    """
    Pull a JSON object out of a model response.

    Handles the three things this proxy actually does: wraps output in ```json
    fences, prefixes a sentence before the object, or appends one after it. Falls
    back to a brace-balanced scan that respects string literals and escapes, so a
    `{` inside a quoted value does not derail it.
    """
    t = text.strip()

    if t.startswith("```"):
        t = t.split("\n", 1)[-1] if "\n" in t else t
        if "```" in t:
            t = t.rsplit("```", 1)[0]
        t = t.strip()

    try:
        return json.loads(t)
    except json.JSONDecodeError:
        pass

    start = t.find("{")
    if start == -1:
        raise LLMError(f"No JSON object found in response: {text[:200]!r}")

    depth = 0
    in_str = False
    escaped = False
    for i, ch in enumerate(t[start:], start=start):
        if in_str:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = t[start : i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError as exc:
                    raise LLMError(f"Malformed JSON object: {exc}") from exc

    raise LLMError(f"Unbalanced JSON in response: {text[:200]!r}")


class LLMClient:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None):
        self.s = settings
        self._client = client
        self._sem = asyncio.Semaphore(settings.max_concurrency)

    async def __aenter__(self) -> LLMClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.s.timeout)
        return self

    async def __aexit__(self, *exc: object) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _post(self, prompt: str, max_tokens: int) -> str:
        assert self._client is not None, "use LLMClient as an async context manager"
        payload = {
            "model": self.s.model,
            "stream": False,  # required — this proxy streams by default
            "temperature": 0,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": JSON_SYSTEM},
                {"role": "user", "content": prompt},
            ],
        }
        async with self._sem:
            r = await self._client.post(
                f"{self.s.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.s.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if r.status_code >= 400:
            raise LLMError(f"HTTP {r.status_code}: {r.text[:300]}")
        try:
            return r.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise LLMError(f"Unexpected response envelope: {r.text[:300]}") from exc

    async def complete_model(
        self,
        prompt: str,
        model_cls: type[T],
        *,
        max_tokens: int = 4000,
        label: str = "call",
    ) -> T:
        """
        Run `prompt` and parse the reply into `model_cls`.

        One repair retry: on failure the model is shown its own broken output and
        the validation error. Given ~32 s per attempt this is capped at a single
        retry deliberately — a second retry would cost more than it recovers.
        """
        raw = await self._post(prompt, max_tokens)

        try:
            return model_cls.model_validate(extract_json(raw))
        except (LLMError, ValidationError) as first:
            log.warning("%s: first attempt unusable (%s), repairing", label, first)

            repair = (
                f"{prompt}\n\n"
                "---\n"
                "Your previous response could not be used.\n\n"
                f"Previous response:\n{raw[:1500]}\n\n"
                f"Problem:\n{first}\n\n"
                "Return ONLY the corrected raw JSON object. No prose, no fences."
            )
            raw2 = await self._post(repair, max_tokens)
            try:
                return model_cls.model_validate(extract_json(raw2))
            except (LLMError, ValidationError) as second:
                raise LLMError(
                    f"{label}: unusable after repair. {second}. Raw: {raw2[:300]!r}"
                ) from second

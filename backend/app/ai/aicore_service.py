"""AI Core service via LiteLLM — structured JSON, streaming, plain text.
Pattern copied from Legal AI project. All LLM calls in NEXORA go through here.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import litellm

litellm.drop_params = True  # Claude on AI Core rejects temperature — drop silently

logger = logging.getLogger(__name__)


class AICoreService:
    def __init__(self, *, model: str, max_tokens: int = 4096, timeout: int = 60) -> None:
        self._model = model
        self._max_tokens = max_tokens
        self._timeout = timeout

    # ── Plain text ────────────────────────────────────────────────────────────

    def complete(self, *, system: str, user: str, max_tokens: int | None = None) -> str:
        from litellm import completion
        response = completion(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens or self._max_tokens,
            timeout=self._timeout,
        )
        return response.choices[0].message.content

    # ── Structured JSON ───────────────────────────────────────────────────────

    def complete_json(self, *, system: str, user: str, max_tokens: int | None = None) -> dict[str, Any]:
        raw = self.complete(system=system, user=user, max_tokens=max_tokens)
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            return json.loads(cleaned.strip())
        except json.JSONDecodeError as exc:
            logger.warning("LLM JSON parse failed, attempting recovery: %s", exc)
            recovered = self._recover_truncated_json(cleaned.strip())
            if recovered is not None:
                return recovered
            logger.error("LLM non-JSON output: %s — raw: %.500s", exc, raw)
            raise ValueError(f"LLM returned non-JSON: {exc}") from exc

    # ── Streaming ─────────────────────────────────────────────────────────────

    def complete_stream(self, *, system: str, user: str, max_tokens: int | None = None):
        """Yields text chunks. Falls back to simulated streaming if model doesn't support it."""
        from litellm import completion
        try:
            response = completion(
                model=self._model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=max_tokens or self._max_tokens,
                timeout=self._timeout,
                stream=True,
            )
            for chunk in response:
                delta = chunk.choices[0].delta
                text = getattr(delta, "content", None)
                if text:
                    yield text
            return
        except Exception as exc:
            if "streaming" not in str(exc).lower():
                raise

        # Fallback: simulate streaming word by word
        logger.info("Streaming not supported for %s, simulating", self._model)
        full = self.complete(system=system, user=user, max_tokens=max_tokens)
        words = full.split(" ")
        for i in range(0, len(words), 3):
            piece = " ".join(words[i:i + 3])
            if i + 3 < len(words):
                piece += " "
            yield piece

    # ── JSON recovery ─────────────────────────────────────────────────────────

    @staticmethod
    def _recover_truncated_json(text: str) -> dict[str, Any] | None:
        """Best-effort: close unclosed braces/brackets to recover truncated JSON."""
        depth_stack: list[str] = []
        in_string = False
        escape_next = False

        for ch in text:
            if escape_next:
                escape_next = False
                continue
            if ch == "\\" and in_string:
                escape_next = True
                continue
            if ch == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch in "{[":
                depth_stack.append("}" if ch == "{" else "]")
            elif ch in "}]":
                if depth_stack and depth_stack[-1] == ch:
                    depth_stack.pop()

        if not depth_stack:
            return None

        candidate = text
        if in_string:
            for i in range(len(candidate) - 1, -1, -1):
                if candidate[i] == '"' and (i == 0 or candidate[i - 1] != "\\"):
                    candidate = candidate[:i]
                    break
            candidate = candidate.rstrip().rstrip(",").rstrip()

        closing = "".join(reversed(depth_stack))
        try:
            return json.loads(candidate + closing)
        except json.JSONDecodeError:
            last_comma = candidate.rfind(",")
            if last_comma > 0:
                try:
                    return json.loads(candidate[:last_comma] + closing)
                except json.JSONDecodeError:
                    pass
        return None

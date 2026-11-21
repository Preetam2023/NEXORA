"""Singleton AI Core service factory."""
from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_ai_service():
    """Full model — used for meeting analysis and conflict detection."""
    from app.ai.aicore_service import AICoreService
    s = get_settings()
    return AICoreService(
        model=s.aicore_llm_model,
        max_tokens=s.aicore_llm_max_tokens,
        timeout=s.aicore_llm_timeout,
    )


@lru_cache(maxsize=1)
def get_fast_ai_service():
    """Fast model — used for copilot chat and quick completions."""
    from app.ai.aicore_service import AICoreService
    s = get_settings()
    model = s.aicore_llm_fast_model or s.aicore_llm_model
    return AICoreService(model=model, max_tokens=2048, timeout=30)

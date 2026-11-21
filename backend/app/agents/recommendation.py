"""Recommendation Agent — generates evidence-backed resolution options.
TODO (Preetam — AI-6): implement run_recommendation_agent node.
Called after Conflict Analyst — enriches conflict records with detailed recommendations.
"""
from __future__ import annotations

from app.agents.state import WorkflowState


def run_recommendation_agent(state: WorkflowState) -> dict:
    """LangGraph node — enrich conflicts with detailed recommendations.
    TODO (Preetam — AI-6): implement this function.

    For efficiency: this can run as part of the conflict analyst prompt (combined call)
    rather than a separate LLM call. Only use a separate call if the conflict analyst
    output needs deeper recommendation analysis.

    If conflict analyst already returns recommendations, this node may just validate/enrich.
    """
    # TODO: implement
    # Option A (fast): conflict analyst already returns recommendation — this is a no-op passthrough
    # Option B (thorough): separate LLM call per conflict to generate detailed pros/cons
    # For the hackathon, Option A is preferred for speed.
    # Return: {"conflicts": state.conflicts}  (possibly enriched)
    raise NotImplementedError("Recommendation Agent not yet implemented — Preetam AI-6")

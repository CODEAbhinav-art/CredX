"""
CredX — LLM Provider Abstraction
Abstract base class for all LLM providers.
Allows swapping Gemini for any other provider without changing calling code.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from backend.models.schemas import CopilotResponse, SimulateResponse


class LLMProvider(ABC):
    """
    Abstract LLM provider.
    All implementations must return Pydantic-validated response objects.
    """

    @abstractmethod
    def generate_copilot_response(
        self,
        question: str,
        context: dict,
    ) -> CopilotResponse:
        """
        Generate a natural-language answer to the user's credit question.

        Args:
            question: The user's question (sanitized)
            context: Minimal structured context from the score response

        Returns:
            CopilotResponse — validated Pydantic model
        """
        ...

    @abstractmethod
    def generate_simulation_explanation(
        self,
        original_score: int,
        simulated_score: int,
        changed_features: list[str],
        original_contributors: list[dict],
        simulated_contributors: list[dict],
    ) -> str:
        """
        Generate a natural-language explanation of the score change in a simulation.

        Returns:
            str — plain text explanation
        """
        ...

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if this provider is configured and reachable."""
        ...

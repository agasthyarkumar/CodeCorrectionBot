import logging

from app.core.config import get_settings
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("dsa_chatbot")

_SUPPORTED = ("grok", "openai", "anthropic")
_PLACEHOLDER_VALUES = {"", "your_api_key_here"}


def _api_key_configured(key: str) -> bool:
    return key.strip() not in _PLACEHOLDER_VALUES


def get_provider() -> BaseLLMProvider:
    settings = get_settings()

    if not _api_key_configured(settings.LLM_API_KEY):
        logger.warning(
            "LLM_API_KEY is not configured (current value: %r). "
            "Falling back to MockProvider — responses are pre-canned, not AI-generated. "
            "To enable real responses: set LLM_API_KEY in backend/.env and restart.",
            settings.LLM_API_KEY or "<empty>",
        )
        from app.providers.mock_provider import MockProvider
        return MockProvider()

    provider = settings.LLM_PROVIDER.lower()

    if provider == "grok":
        from app.providers.grok_provider import GrokProvider
        return GrokProvider()

    if provider == "openai":
        from app.providers.openai_provider import OpenAIProvider
        return OpenAIProvider()

    if provider == "anthropic":
        from app.providers.anthropic_provider import AnthropicProvider
        return AnthropicProvider()

    raise ValueError(
        f"Unsupported LLM_PROVIDER '{provider}'. Must be one of: {', '.join(_SUPPORTED)}"
    )

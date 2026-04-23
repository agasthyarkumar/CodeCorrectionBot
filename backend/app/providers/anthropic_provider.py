import logging

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.providers.base import BaseLLMProvider
from app.utils.system_prompts import DSA_SYSTEM_PROMPT

logger = logging.getLogger("dsa_chatbot")

_BASE_URL = "https://api.anthropic.com/v1"
_ANTHROPIC_VERSION = "2023-06-01"


class AnthropicProvider(BaseLLMProvider):
    def __init__(self) -> None:
        cfg = get_settings()
        self._api_key = cfg.LLM_API_KEY
        self._model = cfg.LLM_MODEL

    async def generate(self, prompt: str, mode: str) -> str:
        payload = {
            "model": self._model,
            "max_tokens": 4096,
            "system": DSA_SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": prompt}],
        }
        headers = {
            "x-api-key": self._api_key,
            "anthropic-version": _ANTHROPIC_VERSION,
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{_BASE_URL}/messages",
                    headers=headers,
                    json=payload,
                )
                resp.raise_for_status()
                return resp.json()["content"][0]["text"]
        except httpx.HTTPStatusError as exc:
            logger.error("Anthropic API error %d: %s", exc.response.status_code, exc.response.text)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")
        except Exception as exc:
            logger.error("Anthropic unexpected error: %s", exc)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")

import logging

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.providers.base import BaseLLMProvider
from app.utils.system_prompts import DSA_SYSTEM_PROMPT

logger = logging.getLogger("dsa_chatbot")

_BASE_URL = "https://api.openai.com/v1"


class OpenAIProvider(BaseLLMProvider):
    def __init__(self) -> None:
        cfg = get_settings()
        self._api_key = cfg.LLM_API_KEY
        self._model = cfg.LLM_MODEL

    async def generate(self, prompt: str, mode: str) -> str:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": DSA_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as exc:
            logger.error("OpenAI API error %d: %s", exc.response.status_code, exc.response.text)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")
        except Exception as exc:
            logger.error("OpenAI unexpected error: %s", exc)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")

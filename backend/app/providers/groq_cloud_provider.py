import logging

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.providers.base import BaseLLMProvider
from app.utils.system_prompts import DSA_SYSTEM_PROMPT

logger = logging.getLogger("dsa_chatbot")


class GroqCloudProvider(BaseLLMProvider):
    def __init__(self) -> None:
        cfg = get_settings()
        self._api_key = cfg.LLM_API_KEY
        self._model = cfg.LLM_MODEL
        self._reasoning_effort = cfg.LLM_REASONING_EFFORT or None
        self._max_tokens = cfg.LLM_MAX_TOKENS

    async def generate(self, prompt: str, mode: str) -> str:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": DSA_SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            "temperature": 1,
            "max_completion_tokens": self._max_tokens,
            "top_p": 1,
        }

        if self._reasoning_effort:
            payload["reasoning_effort"] = self._reasoning_effort

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(_ENDPOINT, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()

            usage = data.get("usage", {})
            logger.info(
                "Groq Cloud [%s] tokens — prompt: %d  completion: %d  total: %d",
                mode,
                usage.get("prompt_tokens", 0),
                usage.get("completion_tokens", 0),
                usage.get("total_tokens", 0),
            )

            return data["choices"][0]["message"]["content"]

        except HTTPException:
            raise
        except httpx.HTTPStatusError as exc:
            logger.error("Groq Cloud API error %d: %s", exc.response.status_code, exc.response.text)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")
        except Exception as exc:
            logger.error("Groq Cloud unexpected error: %s", exc)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")

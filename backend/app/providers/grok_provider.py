import logging

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.providers.base import BaseLLMProvider
from app.utils.system_prompts import DSA_SYSTEM_PROMPT

logger = logging.getLogger("dsa_chatbot")

_ENDPOINT = "https://api.x.ai/v1/responses"

# Hard ceiling on output tokens — prevents runaway reasoning token spend.
_MAX_OUTPUT_TOKENS = 4096


class GrokProvider(BaseLLMProvider):
    def __init__(self) -> None:
        cfg = get_settings()
        self._api_key = cfg.LLM_API_KEY
        self._model = cfg.LLM_MODEL

    async def generate(self, prompt: str, mode: str) -> str:
        payload = {
            "model": self._model,
            "input": [
                {"role": "system", "content": DSA_SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            "max_output_tokens": _MAX_OUTPUT_TOKENS,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(_ENDPOINT, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()

            # Log token usage so spend is visible in backend logs
            usage = data.get("usage", {})
            logger.info(
                "Grok [%s] tokens — input: %d  output: %d  reasoning: %d  total: %d",
                mode,
                usage.get("input_tokens", 0),
                usage.get("output_tokens", 0),
                usage.get("reasoning_tokens", 0),
                usage.get("total_tokens", 0),
            )

            # /v1/responses returns output as a list; find the assistant message block
            for item in data.get("output", []):
                if item.get("type") == "message":
                    for block in item.get("content", []):
                        if block.get("type") == "output_text":
                            return block["text"]

            logger.error("Grok response had no output_text block: %s", data)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")

        except HTTPException:
            raise
        except httpx.HTTPStatusError as exc:
            logger.error("Grok API error %d: %s", exc.response.status_code, exc.response.text)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")
        except Exception as exc:
            logger.error("Grok unexpected error: %s", exc)
            raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")

from __future__ import annotations

import logging

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.utils.system_prompts import PYTHON_AGENT_SYSTEM_PROMPT

logger = logging.getLogger("dsa_chatbot")


class AgentProvider:
    """Multi-turn LLM provider for the agentic coding loop.

    Bypasses the DSA-only system prompt used by the regular providers and
    supports proper conversation history (list of role/content dicts).
    """

    def __init__(self) -> None:
        cfg = get_settings()
        self._api_key = cfg.LLM_API_KEY
        self._model = cfg.LLM_MODEL
        self._provider = cfg.LLM_PROVIDER.lower()
        self._max_tokens = cfg.LLM_MAX_TOKENS
        self._reasoning_effort = cfg.LLM_REASONING_EFFORT or None

    async def chat(
        self,
        messages: list[dict],
        system: str = PYTHON_AGENT_SYSTEM_PROMPT,
    ) -> str:
        try:
            if self._provider in ("groq", "openai"):
                return await self._openai_compat(messages, system)
            if self._provider == "anthropic":
                return await self._anthropic(messages, system)
            if self._provider == "grok":
                return await self._grok(messages, system)
            raise ValueError(f"Unsupported provider for agent mode: {self._provider}")
        except HTTPException:
            raise
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Agent provider API error %d: %s",
                exc.response.status_code,
                exc.response.text,
            )
            raise HTTPException(status_code=502, detail="LLM provider error during agent run")
        except Exception as exc:
            logger.error("Agent provider unexpected error: %s", exc)
            raise HTTPException(status_code=502, detail="Agent LLM provider unavailable")

    # ── Provider implementations ──────────────────────────────────────────────

    async def _openai_compat(self, messages: list[dict], system: str) -> str:
        endpoint = (
            "https://api.groq.com/openai/v1/chat/completions"
            if self._provider == "groq"
            else "https://api.openai.com/v1/chat/completions"
        )
        payload: dict = {
            "model": self._model,
            "messages": [{"role": "system", "content": system}] + messages,
            "temperature": 1,
            "max_completion_tokens": self._max_tokens,
        }
        if self._provider == "groq" and self._reasoning_effort:
            payload["reasoning_effort"] = self._reasoning_effort

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    async def _anthropic(self, messages: list[dict], system: str) -> str:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self._api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self._model,
                    "max_tokens": self._max_tokens,
                    "system": system,
                    "messages": messages,
                },
            )
            resp.raise_for_status()
        return resp.json()["content"][0]["text"]

    async def _grok(self, messages: list[dict], system: str) -> str:
        input_items = [{"role": "system", "content": system}] + [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "https://api.x.ai/v1/responses",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self._model,
                    "input": input_items,
                    "max_output_tokens": self._max_tokens,
                },
            )
            resp.raise_for_status()
        data = resp.json()
        for item in data.get("output", []):
            if item.get("type") == "message":
                for c in item.get("content", []):
                    if c.get("type") == "output_text":
                        return c["text"]
        raise ValueError("Unexpected Grok response format")

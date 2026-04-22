import logging

from fastapi import HTTPException

from app.factory.provider_factory import get_provider
from app.schemas.chat import ChatRequest
from app.utils.prompts import build_prompt

logger = logging.getLogger("dsa_chatbot")


async def process_chat(request: ChatRequest) -> str:
    try:
        provider = get_provider()
    except ValueError as exc:
        logger.error("Provider init failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    prompt = build_prompt(
        mode=request.mode,
        user_message=request.message,
        code=request.code,
    )

    try:
        return await provider.generate(prompt, request.mode)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("LLM service unexpected error: %s", exc)
        raise HTTPException(status_code=502, detail="LLM provider unavailable, try again later")

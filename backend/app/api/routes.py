from fastapi import APIRouter, Depends, Request

from app.core.rate_limit import limiter
from app.core.config import get_settings
from app.core.security import verify_token
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import process_chat

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(get_settings().RATE_LIMIT)
async def chat(
    request: Request,
    body: ChatRequest,
    _token: str = Depends(verify_token),
) -> ChatResponse:
    response = await process_chat(body)
    return ChatResponse(response=response, mode=body.mode)

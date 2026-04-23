from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.core.rate_limit import limiter
from app.core.config import get_settings
from app.core.security import verify_token
from app.schemas.chat import AgentRequest, ChatRequest, ChatResponse
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


@router.post("/agent")
@limiter.limit(get_settings().RATE_LIMIT)
async def agent(
    request: Request,
    body: AgentRequest,
    _token: str = Depends(verify_token),
) -> StreamingResponse:
    from app.services.agent_service import run_agent

    async def stream():
        async for chunk in run_agent(body.message, body.code):
            yield chunk

    return StreamingResponse(stream(), media_type="text/event-stream")

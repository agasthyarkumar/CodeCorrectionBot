from typing import Literal, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    mode: Literal["explain", "generate", "fix", "hint"]
    code: Optional[str] = Field(None, max_length=10000)


class ChatResponse(BaseModel):
    response: str
    mode: str


class AgentRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    code: Optional[str] = Field(None, max_length=10000)

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.core.config import get_settings
from app.core.middleware import LoggingMiddleware
from app.core.rate_limit import limiter
from app.api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

_settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log = logging.getLogger("dsa_chatbot")
    log.info(
        "DSA Chatbot starting — provider: %s  model: %s",
        _settings.LLM_PROVIDER,
        _settings.LLM_MODEL,
    )

    _placeholder = {"", "your_api_key_here"}
    if _settings.LLM_API_KEY.strip() in _placeholder:
        log.warning("=" * 60)
        log.warning("  ⚠  LLM_API_KEY IS NOT CONFIGURED")
        log.warning("  The chatbot is running in MOCK MODE.")
        log.warning("  All responses are pre-canned, not AI-generated.")
        log.warning("  To enable real responses:")
        log.warning("    1. Open backend/.env")
        log.warning("    2. Set LLM_API_KEY=<your key>")
        log.warning("    3. Restart the server")
        log.warning("=" * 60)

    yield


app = FastAPI(
    title="DSA Chatbot API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

app.include_router(router, prefix="/api/v1")


@app.get("/health")
async def health():
    mock = _settings.LLM_API_KEY.strip() in {"", "your_api_key_here"}
    return {
        "status": "ok",
        "provider": _settings.LLM_PROVIDER,
        "model": _settings.LLM_MODEL,
        "mode": "mock" if mock else "live",
    }

# DSA Chatbot

A production-style Data Structures & Algorithms learning tool powered by an LLM backend. Supports four interaction modes, provider-agnostic LLM integration, bearer-token auth, and per-IP rate limiting.

---

## Features

| Mode | What it does |
|------|-------------|
| **Explain** | Definition, intuition, worked example, time & space complexity |
| **Generate** | Full problem statement with constraints, examples, and a hint |
| **Fix** | Bug analysis, corrected code, explanation, complexity review |
| **Hint** | Socratic nudges only — no spoilers, no full solutions |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, uvicorn |
| Frontend | React 18, Vite, react-markdown |
| LLM | Provider-agnostic — Grok (default), OpenAI, Anthropic |
| Auth | Bearer token (env-based, no user accounts) |
| Rate limiting | slowapi — 5 req/min per IP (configurable) |

---

## Project Structure

```
CodeCorrectionBot/
├── start.sh                    # Linux/macOS launcher
├── start.bat                   # Windows launcher
│
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, middleware, lifespan
│   │   ├── api/
│   │   │   └── routes.py       # POST /api/v1/chat
│   │   ├── core/
│   │   │   ├── config.py       # All env vars (pydantic BaseSettings)
│   │   │   ├── security.py     # Bearer token verification (Depends)
│   │   │   ├── middleware.py   # Request logging (method, path, status, ms)
│   │   │   └── rate_limit.py   # slowapi Limiter instance
│   │   ├── providers/
│   │   │   ├── base.py         # Abstract base: async generate(prompt, mode)
│   │   │   ├── grok_provider.py
│   │   │   ├── openai_provider.py
│   │   │   └── anthropic_provider.py
│   │   ├── factory/
│   │   │   └── provider_factory.py  # Reads LLM_PROVIDER, returns instance
│   │   ├── services/
│   │   │   └── llm_service.py  # Only layer routes interact with
│   │   ├── schemas/
│   │   │   └── chat.py         # ChatRequest / ChatResponse (Pydantic)
│   │   └── utils/
│   │       └── prompts.py      # All 4 prompt templates
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── App.jsx             # Root — state, mode, error, loading
    │   ├── api.js              # fetch wrapper, injects Bearer token
    │   └── components/
    │       ├── Chat.jsx        # Markdown renderer, typing indicator
    │       ├── InputBox.jsx    # Message textarea + send button
    │       ├── ModeSelector.jsx# Mode toggle buttons
    │       └── CodeInput.jsx   # Code paste area (fix mode only)
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## Quick Start

### Option A — Scripts (recommended)

**Linux / macOS**
```bash
git clone <repo-url>
cd CodeCorrectionBot
chmod +x start.sh
./start.sh
```

**Windows**
```bat
git clone <repo-url>
cd CodeCorrectionBot
start.bat
```

Both scripts handle everything automatically:
- Create `backend/.venv` and install Python deps
- Run `npm install` if `node_modules` is missing
- Copy `.env.example` → `.env` if no `.env` exists
- Warn about unfilled placeholder values
- Start backend on **:8000** and frontend on **:5173**

---

### Option B — Manual

**Backend**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then edit .env
uvicorn app.main:app --reload --port 8000
```

**Frontend** (new terminal)
```bash
cd frontend
npm install
cp .env.example .env               # then edit .env
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### `backend/.env`

```env
# LLM provider: grok | openai | anthropic
LLM_PROVIDER=grok

# Model string for the chosen provider
# grok → grok-beta  |  openai → gpt-4o  |  anthropic → claude-opus-4-7
LLM_MODEL=grok-beta

# API key for the chosen provider
LLM_API_KEY=your_api_key_here

# Secret token — frontend must send this as: Authorization: Bearer <token>
API_TOKEN=your_secret_token_here

# Rate limit per IP — format: <count>/<period>  (second | minute | hour | day)
RATE_LIMIT=5/minute
```

### `frontend/.env`

```env
# Backend base URL (no trailing slash)
VITE_API_URL=http://localhost:8000

# Must match API_TOKEN in backend/.env
VITE_API_TOKEN=your_secret_token_here
```

---

## API Reference

### `POST /api/v1/chat`

**Headers**
```
Authorization: Bearer <API_TOKEN>
Content-Type: application/json
```

**Request body**
```json
{
  "message": "Explain binary search",
  "mode": "explain",
  "code": null
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `message` | string | yes | 1–4000 chars |
| `mode` | string | yes | `explain` \| `generate` \| `fix` \| `hint` |
| `code` | string | no | Required for best results in `fix` mode. Max 10 000 chars |

**Response**
```json
{
  "response": "## Binary Search\n\n...",
  "mode": "explain"
}
```

**Error responses**

| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid Bearer token |
| 422 | Validation error (bad mode, empty message, etc.) |
| 429 | Rate limit exceeded |
| 502 | LLM provider unreachable |

### `GET /health`
```json
{ "status": "ok", "provider": "grok", "model": "grok-beta" }
```

---

## Switching LLM Providers

Change two lines in `backend/.env` — no code changes needed:

| Provider | `LLM_PROVIDER` | Example `LLM_MODEL` | API Key source |
|----------|---------------|---------------------|---------------|
| Grok (xAI) | `grok` | `grok-beta` | console.x.ai |
| OpenAI | `openai` | `gpt-4o` | platform.openai.com |
| Anthropic | `anthropic` | `claude-opus-4-7` | console.anthropic.com |

---

## Development Notes

- **Rate limit** is applied per IP via `slowapi`. Adjust `RATE_LIMIT` in `.env` (e.g. `20/minute` for local dev).
- **CORS** is open (`*`) for local development. Restrict `allow_origins` in `app/main.py` before deploying.
- All LLM calls use `httpx` with a **60-second timeout**. Increase in the provider files if needed for slow models.
- The frontend uses **plain CSS** (no framework). Styles live alongside each component in `.css` files.
- `react-markdown` + `react-syntax-highlighter` handle all LLM output rendering — never rendered as raw HTML.

---

## Requirements

| Tool | Minimum version |
|------|----------------|
| Python | 3.9 |
| Node.js | 18 |
| npm | 9 |

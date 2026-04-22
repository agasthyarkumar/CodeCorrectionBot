#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  DSA Chatbot — dev launcher
#  Starts FastAPI backend (port 8000) + Vite frontend (port 5173) together.
#  Press Ctrl+C once to stop both.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
R='\033[0;31m'  G='\033[0;32m'  Y='\033[1;33m'
C='\033[0;36m'  B='\033[1m'     D='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/.venv"

BACKEND_PID=""
FRONTEND_PID=""

# ── Cleanup on exit / Ctrl+C ─────────────────────────────────────────────────
cleanup() {
    echo ""
    echo -e "${Y}Stopping services...${D}"
    if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null
        echo -e "  ${R}✗${D} Backend  (PID $BACKEND_PID) stopped"
    fi
    if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null
        echo -e "  ${R}✗${D} Frontend (PID $FRONTEND_PID) stopped"
    fi
    echo -e "${Y}Done.${D}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Helpers ───────────────────────────────────────────────────────────────────
require() {
    command -v "$1" &>/dev/null || {
        echo -e "${R}ERROR:${D} '$1' not found. Please install it and re-run."
        exit 1
    }
}

info()  { echo -e "${C}  ▸${D} $*"; }
ok()    { echo -e "${G}  ✓${D} $*"; }
warn()  { echo -e "${Y}  !${D} $*"; }
fail()  { echo -e "${R}  ✗ ERROR:${D} $*"; exit 1; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${B}╔══════════════════════════════════════╗${D}"
echo -e "${B}║        DSA Chatbot — Dev Start       ║${D}"
echo -e "${B}╚══════════════════════════════════════╝${D}"
echo ""

# ── Dependency checks ─────────────────────────────────────────────────────────
info "Checking system dependencies..."
require python3
require node
require npm
ok "python3 $(python3 --version | awk '{print $2}')  |  node $(node --version)  |  npm $(npm --version)"

# ── .env guards ───────────────────────────────────────────────────────────────
echo ""
info "Checking .env files..."

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    warn "backend/.env created from .env.example — fill in LLM_API_KEY and API_TOKEN before using the chatbot."
else
    ok "backend/.env found"
    if grep -q "your_api_key_here\|your_secret_token_here" "$BACKEND_DIR/.env"; then
        warn "backend/.env still has placeholder values — update LLM_API_KEY / API_TOKEN."
    fi
fi

if [[ ! -f "$FRONTEND_DIR/.env" ]]; then
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
    warn "frontend/.env created from .env.example — set VITE_API_TOKEN to match your backend API_TOKEN."
else
    ok "frontend/.env found"
    if grep -q "your_secret_token_here" "$FRONTEND_DIR/.env"; then
        warn "frontend/.env still has placeholder VITE_API_TOKEN."
    fi
fi

# ── Python virtualenv ─────────────────────────────────────────────────────────
echo ""
info "Setting up Python virtualenv..."

if [[ ! -d "$VENV_DIR" ]]; then
    python3 -m venv "$VENV_DIR"
    ok "Virtualenv created at backend/.venv"
else
    ok "Virtualenv already exists"
fi

PYTHON="$VENV_DIR/bin/python"
PIP="$VENV_DIR/bin/pip"

info "Installing/verifying backend dependencies..."
"$PIP" install --quiet --upgrade pip
"$PIP" install --quiet -r "$BACKEND_DIR/requirements.txt"
ok "Backend dependencies ready"

# ── Frontend node_modules ─────────────────────────────────────────────────────
echo ""
info "Installing/verifying frontend dependencies..."
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    npm --prefix "$FRONTEND_DIR" install --silent
    ok "Frontend node_modules installed"
else
    ok "node_modules already present"
fi

# ── Start services ────────────────────────────────────────────────────────────
echo ""
echo -e "${B}Starting services...${D}"
echo ""

# Backend
(
    cd "$BACKEND_DIR"
    "$VENV_DIR/bin/uvicorn" app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 \
        | sed "s/^/$(printf "${C}[BACKEND] ${D}")/"
) &
BACKEND_PID=$!
ok "Backend  started → http://localhost:8000  (PID $BACKEND_PID)"

# Give uvicorn a moment to bind before starting frontend
sleep 1

# Frontend
(
    cd "$FRONTEND_DIR"
    npm run dev 2>&1 \
        | sed "s/^/$(printf "${G}[FRONTEND]${D} ")/"
) &
FRONTEND_PID=$!
ok "Frontend started → http://localhost:5173  (PID $FRONTEND_PID)"

echo ""
echo -e "${Y}Both services running. Press Ctrl+C to stop.${D}"
echo ""

# ── Wait until either process exits unexpectedly ──────────────────────────────
wait "$BACKEND_PID" "$FRONTEND_PID"

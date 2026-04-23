from __future__ import annotations

import json
import logging
import re
from typing import AsyncIterator, Optional

from fastapi import HTTPException

from app.core.config import get_settings
from app.providers.agent_provider import AgentProvider
from app.utils.code_executor import execute_python

logger = logging.getLogger("dsa_chatbot")


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _extract_code(text: str) -> Optional[str]:
    match = re.search(r"```python\s*\n(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else None


def _is_final(text: str) -> bool:
    """True when the LLM signals it is done (no more code to run)."""
    stripped = text.strip()
    return stripped.upper().startswith("FINAL:") or "```python" not in stripped


async def run_agent(
    task: str, code: Optional[str] = None
) -> AsyncIterator[str]:
    """Agentic loop: generate → execute → observe → fix → repeat.

    Yields SSE-formatted JSON strings. Event shapes:
      {"type": "thinking", "content": str}
      {"type": "code",     "content": str, "iteration": int}
      {"type": "running",  "content": str, "iteration": int}
      {"type": "output",   "content": str, "success": bool, "iteration": int}
      {"type": "final",    "content": str, "iterations": int}
      {"type": "error",    "content": str}
    """
    cfg = get_settings()

    _PLACEHOLDER = {"", "your_api_key_here"}
    if not cfg.LLM_API_KEY or cfg.LLM_API_KEY.strip() in _PLACEHOLDER:
        yield _sse({
            "type": "error",
            "content": (
                "LLM_API_KEY is not configured. "
                "Set it in backend/.env and restart the server to use Agent mode."
            ),
        })
        return

    max_iterations: int = cfg.AGENT_MAX_ITERATIONS
    exec_timeout: int = cfg.AGENT_EXEC_TIMEOUT

    provider = AgentProvider()
    messages: list[dict] = []

    # Build initial user message
    user_content = f"Task: {task}"
    if code and code.strip():
        user_content += f"\n\nStarting code (optional context):\n```python\n{code.strip()}\n```"
    messages.append({"role": "user", "content": user_content})

    yield _sse({"type": "thinking", "content": "Analyzing your task..."})

    for iteration in range(1, max_iterations + 1):
        # ── LLM call ────────────────────────────────────────────────────────
        try:
            response = await provider.chat(messages)
        except HTTPException as exc:
            yield _sse({"type": "error", "content": f"LLM error: {exc.detail}"})
            return

        messages.append({"role": "assistant", "content": response})

        # ── Check if LLM declared the solution final ─────────────────────
        if _is_final(response):
            yield _sse({"type": "final", "content": response, "iterations": iteration - 1})
            return

        # ── Emit the code attempt so the frontend can show it ────────────
        yield _sse({"type": "code", "content": response, "iteration": iteration})

        # ── Extract and execute Python ────────────────────────────────────
        code_to_run = _extract_code(response)
        if not code_to_run:
            # LLM wrote a ```python block with no extractable code — treat as final
            yield _sse({"type": "final", "content": response, "iterations": iteration - 1})
            return

        yield _sse({
            "type": "running",
            "content": f"Running attempt {iteration}...",
            "iteration": iteration,
        })

        result = await execute_python(code_to_run, timeout=exec_timeout)

        if result.timed_out:
            success = False
            exec_summary = (
                f"Timed out after {exec_timeout}s — "
                "likely an infinite loop or an algorithm that is too slow."
            )
        elif result.returncode == 0:
            success = True
            exec_summary = result.stdout if result.stdout.strip() else "(ran successfully, no output)"
        else:
            success = False
            parts: list[str] = []
            if result.stderr.strip():
                parts.append(result.stderr.strip())
            if result.stdout.strip():
                parts.append(f"Stdout before error:\n{result.stdout.strip()}")
            exec_summary = "\n".join(parts) or "Unknown error (non-zero exit, no output)"

        yield _sse({
            "type": "output",
            "content": exec_summary,
            "success": success,
            "iteration": iteration,
        })

        # ── Feed execution result back for next iteration ─────────────────
        if success:
            feedback = (
                f"Execution output:\n```\n{exec_summary}\n```\n\n"
                "The code ran successfully. "
                "If the output is correct and complete, write your FINAL: response. "
                "If you want to improve it first, do so."
            )
        else:
            feedback = (
                f"Execution error:\n```\n{exec_summary}\n```\n\n"
                "Fix the bug and try again."
            )
        messages.append({"role": "user", "content": feedback})

    yield _sse({
        "type": "error",
        "content": f"Could not produce a verified solution after {max_iterations} attempts.",
    })

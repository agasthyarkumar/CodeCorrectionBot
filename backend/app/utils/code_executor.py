from __future__ import annotations

import asyncio
import os
import sys
import tempfile
from dataclasses import dataclass

_MAX_OUTPUT_BYTES = 5000
_MAX_STDERR_BYTES = 2000


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    returncode: int
    timed_out: bool


async def execute_python(code: str, timeout: int = 10) -> ExecutionResult:
    """Run Python code in a subprocess, capture output, enforce timeout."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as f:
        f.write(code)
        tmp_path = f.name

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable,
            tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout_b, stderr_b = await asyncio.wait_for(
                proc.communicate(), timeout=float(timeout)
            )
            return ExecutionResult(
                stdout=stdout_b.decode(errors="replace")[:_MAX_OUTPUT_BYTES],
                stderr=stderr_b.decode(errors="replace")[:_MAX_STDERR_BYTES],
                returncode=proc.returncode,
                timed_out=False,
            )
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            return ExecutionResult(
                stdout="",
                stderr=f"Execution timed out after {timeout} seconds.",
                returncode=-1,
                timed_out=True,
            )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

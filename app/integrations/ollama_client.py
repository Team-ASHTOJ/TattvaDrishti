from __future__ import annotations

import json
import logging
import subprocess
from typing import Optional

from ..config import get_settings

logger = logging.getLogger(__name__)


class OllamaClient:
    """
    Lightweight wrapper to query a local Ollama model for qualitative risk scoring.
    Expects Ollama CLI to be installed and running on localhost.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    def risk_assessment(self, text: str) -> Optional[float]:
        if not self.settings.ollama_enabled:
            return None
        limit = max(256, int(self.settings.ollama_prompt_chars))
        if len(text) <= limit:
            snippet = text
        else:
            head = text[: limit // 2]
            tail = text[-(limit // 2) :]
            snippet = f"{head}\n...\n{tail}"
        prompt = (
            "You are a counter-disinformation analyst. Read the following content and "
            "respond with a single JSON object containing keys `risk` (0-1 float) and "
            "`justification` (short string). Content:\n"
            "```"
            f"{snippet}"
            "```"
        )
        base_timeout = max(3, int(self.settings.ollama_timeout))
        ceiling = max(base_timeout, int(self.settings.ollama_timeout_ceiling))
        adaptive_timeout = min(
            ceiling,
            base_timeout + max(0, len(snippet) - 400) / 400,
        )
        try:
            result = subprocess.run(
                ["ollama", "run", self.settings.ollama_model],
                capture_output=True,
                input=prompt,
                text=True,
                timeout=adaptive_timeout,
                check=False,
            )
        except FileNotFoundError:
            logger.warning("Ollama CLI not available; skipping qualitative risk scoring.")
            return None
        except subprocess.TimeoutExpired:
            logger.warning(
                "Ollama model '%s' timed out after %ss "
                "(prompt chars=%s, base timeout=%s, ceiling=%s)",
                self.settings.ollama_model,
                adaptive_timeout,
                len(snippet),
                base_timeout,
                ceiling,
            )
            return None

        if result.returncode != 0:
            stderr = (result.stderr or "").strip()
            logger.warning(
                "Ollama model '%s' exited with code %s. stderr: %s",
                self.settings.ollama_model,
                result.returncode,
                stderr,
            )
            return None

        output = result.stdout.strip()
        data = self._extract_json(output)
        if not data:
            logger.warning(
                "Ollama model '%s' returned non-JSON payload: %s",
                self.settings.ollama_model,
                output[:300],
            )
            return None
        try:
            risk = float(data.get("risk", 0.0))
        except (TypeError, ValueError):
            logger.warning(
                "Ollama model '%s' JSON payload missing numeric risk: %s",
                self.settings.ollama_model,
                data,
            )
            return None
        return max(0.0, min(1.0, risk))

    @staticmethod
    def _extract_json(text: str) -> Optional[dict]:
        """
        Attempt to recover a JSON object from model output, even if surrounded
        with prose or fenced code blocks.
        """
        if not text:
            return None
        cleaned = text.replace("```json", "").replace("```", "").strip()

        # Fast path: exact JSON block on a single line.
        stripped_lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
        for line in reversed(stripped_lines):
            if line.startswith("{") and line.endswith("}"):
                try:
                    return json.loads(line)
                except json.JSONDecodeError:
                    continue

        decoder = json.JSONDecoder()
        index = 0
        while index < len(cleaned):
            try:
                payload, end = decoder.raw_decode(cleaned, index)
            except json.JSONDecodeError as error:
                index = error.pos + 1
                continue
            if isinstance(payload, dict):
                return payload
            index = end
        return None

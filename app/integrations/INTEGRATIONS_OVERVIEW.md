# Integrations Module Overview (app/integrations/)

Purpose
- Encapsulate model and API clients used by the detection pipeline.
- Provide graceful fallbacks when optional AI services are unavailable.

Key components
- hf_detector.py: dual-model Hugging Face pipeline (AI vs human + model family).
- ollama_client.py: local LLM client for semantic risk scoring and JSON parsing.

Features that show engineering depth
- LoRA adapter loading with checkpoint-aware fallbacks.
- Model-family classification for forensic attribution.
- Robust JSON extraction and numeric fallback parsing from LLM output.
- Defensive initialization so the API keeps working without Ollama.

Libraries used
- transformers, torch, peft
- ollama (local LLM runtime)
- logging, json

# Backend Module Overview (app/)

## Purpose
The backend exposes APIs for narrative intake, risk scoring, graph intelligence, and federated sharing. It orchestrates AI models, provenance checks, and persistence, then streams events to the UI.

## Primary Responsibilities
- Accept and validate structured intake payloads.
- Run the detection pipeline and compute composite scores.
- Persist cases, audits, and fingerprints in SQLite.
- Generate sharing packages with policy tags and hop traces.
- Maintain a federated ledger for cross-node sharing.
- Stream events for live dashboards (SSE).
- Provide heatmap and image analysis endpoints.

## API Endpoints (summary)
- POST /api/v1/intake: run analysis and persist a case.
- GET /api/v1/cases/{intake_id}: fetch stored case data.
- POST /api/v1/share: generate a sharing package.
- GET /api/v1/events/stream: SSE updates for dashboards.
- GET /api/v1/integrations/threat-intel: graph summary for intel feeds.
- GET /api/v1/integrations/siem: SIEM correlation payload.
- Heatmap: /api/v1/heatmap/*
- Federated ledger: /api/v1/federated/*
- Image analysis: /api/v1/image/analyze

## Key Files
- main.py: API router + SSE + blockchain + image analysis
- config.py: environment-driven settings
- schemas.py: request/response data models
- heatmap.py: risk point persistence and retrieval

## Internal Modules
- auth/: role checks and permissions
- integrations/: Hugging Face + Ollama client wrappers
- models/: detection, graph intel, watermark, sharing
- services/: orchestrator pipeline
- storage/: SQLite persistence
- federated/: ledger, crypto, peer node logic

## Config and Environment
- APP_ENV, APP_SECRET, DATABASE_URL
- HF_MODEL_NAME, HF_TOKENIZER_NAME, HF_DEVICE, HF_SCORE_THRESHOLD
- OLLAMA_ENABLED, OLLAMA_MODEL, OLLAMA_HOST, OLLAMA_TIMEOUT
- BLOCK_ENCRYPTION_KEY, FEDERATED_NODES, NODE_URL
- SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET

## Data Stores
- data/app.db for cases, audit logs, fingerprints
- data/federated_ledger.db for blockchain state

## Engineering Notes
- Optional AI integrations are defensive: if models are missing, pipeline still runs.
- Graph intelligence is computed in-memory and summarized per request.
- SSE stream is backed by an in-memory asyncio queue.

## Extension Points
- Replace stylometric scoring with custom ML model.
- Connect a production DB (Postgres) using the same interface.
- Add additional intake types (URLs, attachments, social metadata).

# TattvaDrishti Project Overview

## Mission
TattvaDrishti is a prototype platform to detect and mitigate malign information operations. The system blends multi-signal AI detection, stylometry, semantic risk scoring, provenance checks, and graph intelligence. Results are delivered through a FastAPI backend and a rich Next.js analyst dashboard.

## What This Project Demonstrates
- Multi-layer risk scoring with explainable evidence trails.
- Robust AI integration that degrades gracefully when optional services are unavailable.
- Real-time analyst experience via Server-Sent Events (SSE).
- Federated intelligence sharing with encryption, signatures, and tamper checks.
- Visual analytics across risk, graphs, hop traces, and geographic heatmaps.

## High-Level Architecture
- Backend (FastAPI): ingestion, detection, storage, SSE events, sharing, and federated ledger endpoints.
- Intelligence engines: detection, watermark verification, graph intel, and sharing package creation.
- Integrations: Hugging Face model inference and local Ollama semantic scoring.
- Frontend (Next.js): multi-tier dashboards for analysts and superusers.
- Storage: SQLite for cases, audit log, fingerprints, and federated ledger.

## Core Flows
1. Intake submission -> analysis pipeline -> result persisted + SSE broadcast.
2. Case retrieval -> dashboard hydration and visualization.
3. Sharing package creation -> policy tagging + hop trace -> optional federated ledger push.
4. Image analysis -> external moderation API -> UI visualization.

## API Surface (summary)
- POST /api/v1/intake
- GET /api/v1/cases/{intake_id}
- POST /api/v1/share
- GET /api/v1/events/stream
- GET /api/v1/integrations/threat-intel
- GET /api/v1/integrations/siem
- Federated ledger routes under /api/v1/federated/*
- POST /api/v1/image/analyze

## Primary Tech Stack
- Backend: FastAPI, Pydantic, SQLite, NetworkX
- AI: Transformers, PyTorch, PEFT (LoRA), Ollama client
- Security: cryptography (Fernet + Ed25519)
- Frontend: Next.js, React, Tailwind CSS, Leaflet

## Configuration Highlights
- AI models: HF_MODEL_NAME, HF_TOKENIZER_NAME, HF_DEVICE
- Ollama: OLLAMA_ENABLED, OLLAMA_MODEL, OLLAMA_HOST
- Storage: DATABASE_URL
- Federation: BLOCK_ENCRYPTION_KEY, FEDERATED_NODES, NODE_URL

## Testing
- pytest with AI model loading disabled for deterministic runs.

## Design Intent
- Build an analyst-grade prototype that is both transparent and operationally realistic.
- Keep the code modular so detection, provenance, and graph intelligence can evolve independently.
- Provide multiple dashboards to show role-specific UX depth.

## Known Constraints
- Optional AI services depend on external model availability.
- SQLite is used for local persistence; scaling would require a stronger DB.
- Federated ledger is a lightweight simulation, not a full blockchain consensus.

## Useful Entry Points
- Backend router: app/main.py
- Pipeline: app/services/orchestrator.py
- Detection engine: app/models/detection.py
- Frontend dashboard: frontend/app/page.js

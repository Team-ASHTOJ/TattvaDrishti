# Backend Module Overview (app/)

This module houses the FastAPI backend and the core analysis pipeline. It exposes public APIs, orchestrates multi-signal detection, manages storage, and hosts federated sharing logic.

Key capabilities
- Content intake analysis with composite risk scoring
- Real-time event stream for live dashboards (SSE)
- Threat intelligence feeds and SIEM-style payloads
- Federated ledger endpoints for cross-border sharing
- Image risk analysis through external moderation API

Core files
- main.py: API routing, SSE stream, federated routes, image analysis, heatmap capture
- config.py: environment-driven settings for AI, storage, blockchain, and integrations
- schemas.py: Pydantic models for intakes, results, sharing, and graph outputs
- heatmap.py: storage-backed risk map API and persistence

Internal structure
- auth/: role checks and access gating
- integrations/: AI model clients (HF + Ollama)
- models/: detection, graph intel, sharing, watermark verification
- services/: orchestration logic for the full pipeline
- storage/: SQLite persistence and audit log
- federated/: blockchain-like ledger, encryption, and P2P nodes

Libraries used
- fastapi, pydantic, pydantic-settings
- networkx, requests, httpx
- cryptography (Fernet + Ed25519)
- transformers, torch, peft, ollama (optional)

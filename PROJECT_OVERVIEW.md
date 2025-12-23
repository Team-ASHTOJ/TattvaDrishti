# TattvaDrishti Project Overview

TattvaDrishti is a prototype platform for detecting and mitigating malign information operations. It blends multi-signal AI detection, semantic risk scoring, provenance checks, and graph intelligence, then exposes the results through a FastAPI backend and a Next.js dashboard.

What this project demonstrates
- Multi-layer scoring: stylometrics + behavioral heuristics + Hugging Face AI detection + optional Ollama semantic risk.
- Explainability: heuristic trails, decision rationales, and case summaries built for analyst review.
- Operational readiness: SSE event streaming, audit logging, and federated sharing packages.
- Security thinking: encryption, signing, and verification for a lightweight federated ledger.
- UI depth: multiple dashboards, real-time updates, and investigative views (graph, heatmap, hop trace).

Core workflows
- Intake submission -> analysis orchestrator -> storage + SSE -> case retrieval
- Sharing package creation -> policy tagging + hop trace -> optional federated ledger push
- Image analysis -> external API moderation + risk display

Primary tech stack
- Backend: FastAPI, Pydantic, SQLite, NetworkX, Cryptography
- AI: Transformers, PyTorch, PEFT (LoRA), Ollama client
- Frontend: Next.js, React, Tailwind CSS, Leaflet

Entry points
- Backend API: app/main.py
- Frontend UI: frontend/app/page.js
- Orchestration: app/services/orchestrator.py

Deployment notes
- Python 3.11 is required.
- Ollama and Hugging Face models are optional and gracefully degrade.
- Local services assume ports 8000 (API) and 3000 (frontend).

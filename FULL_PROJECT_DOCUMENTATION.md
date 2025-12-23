# TattvaDrishti - Complete Project Documentation

## 1. Executive Summary
TattvaDrishti is a prototype platform for detecting and mitigating malign information operations. It blends stylometric heuristics, AI model inference, semantic risk scoring, provenance checks, and graph intelligence into a single pipeline. A FastAPI backend powers ingestion and analysis, while a Next.js frontend delivers analyst-grade dashboards, live updates, and federated sharing controls.

This document is the full system reference: architecture, data flow, modules, API contracts, data models, configuration, operations, and extension points.

---

## 2. System Goals
- Detect AI-generated or coordinated malicious narratives.
- Provide explainable evidence trails (heuristics, model confidence, provenance notes).
- Track actors/narratives/regions in a graph intelligence layer.
- Enable cross-node sharing with encryption and tamper evidence.
- Deliver real-time analyst UX with live events and visual intelligence.
- Support future expansion to multimedia and federated ecosystems.

---

## 3. High-Level Architecture

### 3.1 Core Components
- **Backend (FastAPI)**: ingestion, analysis, storage, SSE, sharing, ledger endpoints.
- **Detection Engines**: stylometrics + behavior + AI detectors + semantic risk.
- **Provenance**: watermark and signature checks.
- **Graph Intelligence**: community, coordination, and propagation insights.
- **Federated Ledger**: encrypted and signed block logging with peer sync.
- **Frontend (Next.js)**: dashboards, metrics, maps, and sharing workflows.

### 3.2 Data Flow - Intake
1. `POST /api/v1/intake`
2. Orchestrator runs detection, provenance, graph ingestion.
3. Results persisted to SQLite.
4. SSE event emitted.
5. UI updates in real time.

### 3.3 Data Flow - Sharing
1. `POST /api/v1/share`
2. Policy tags and hop trace generated.
3. Sharing package returned to UI.
4. Optional federated ledger block created and broadcast.

### 3.4 Data Flow - Heatmap
1. Intake includes region metadata.
2. Normalized score logged into heatmap store.
3. UI fetches heatmap grid and renders.

### 3.5 Data Flow - Image Analysis
1. UI submits image to `/api/v1/image/analyze`.
2. Backend forwards to external moderation API.
3. UI renders AI/gore/offensive risk signals.

---

## 4. Backend Deep Dive (app/)

### 4.1 app/main.py
Role: API router for the entire backend.

Endpoints (core)
- `POST /api/v1/intake`: main analysis intake.
- `GET /api/v1/cases/{intake_id}`: fetch stored case.
- `POST /api/v1/share`: generate sharing package.
- `GET /api/v1/events/stream`: SSE stream.
- `GET /api/v1/integrations/threat-intel`: threat intel feed.
- `GET /api/v1/integrations/siem`: SIEM correlation payload.

Endpoints (support)
- Heatmap: `/api/v1/heatmap/add-risk-point`, `/api/v1/heatmap/grid`.
- Federated ledger: `/api/v1/federated/*`.
- Image analysis: `/api/v1/image/analyze`.

Behavior details
- Requires region metadata for heatmap logging.
- Uses role-based access check for intake and dashboard retrieval.
- Streams events via `StreamingResponse` and SSE format.

---

### 4.2 app/config.py
Centralized environment configuration.

Key settings
- `APP_ENV`: dev/prod (dev bypasses auth).
- `APP_SECRET`: package signing secret.
- `DATABASE_URL`: SQLite connection string.

AI settings
- `HF_MODEL_NAME`, `HF_TOKENIZER_NAME`, `HF_DEVICE`, `HF_SCORE_THRESHOLD`.
- `OLLAMA_ENABLED`, `OLLAMA_MODEL`, `OLLAMA_HOST`, `OLLAMA_TIMEOUT`.

Federation
- `BLOCK_ENCRYPTION_KEY`, `FEDERATED_NODES`, `NODE_URL`.

Image moderation
- `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET`.

---

### 4.3 app/schemas.py
Pydantic models for input/output.

Core models
- `ContentIntake`: text, language, source, metadata, tags.
- `DetectionBreakdown`: stylometrics, heuristics, AI signals.
- `DetectionResult`: full output for API and UI.
- `GraphSummary`, `GNNCluster`, `CoordinationAlert`, `PropagationChain`.
- `SharingRequest`, `SharingPackage`.

---

### 4.4 app/models/detection.py
Stylometric + heuristic detection engine.

Key features
- MATTR lexical diversity
- Sentence length variance
- Token burstiness
- Character entropy
- Repetition rate
- Punctuation variety
- Vocabulary richness proxy

Behavioral heuristics
- Urgency and CTA detection
- Emotional manipulation indicators
- Platform risk boosts

AI fusion
- Hugging Face AI detector
- Optional model-family attribution
- Optional Ollama semantic risk score

Outputs
- Composite score
- Classification bucket
- Heuristic explanations

---

### 4.5 app/integrations/hf_detector.py
Hugging Face inference pipeline.

Features
- LoRA adapter loading for AI vs Human detection.
- Optional model family classifier.
- Automatic device selection (CUDA if available).
- `DISABLE_AI_MODELS` for test mode.

---

### 4.6 app/integrations/ollama_client.py
Local LLM semantic scoring.

Features
- Prompt truncation to fit token budgets.
- JSON-first extraction with numeric fallback.
- Defensive initialization (no crash if Ollama missing).

---

### 4.7 app/models/graph_intel.py
Graph intelligence engine.

Features
- Maintains graph of content, actors, narratives, and regions.
- Torch-backed GNN-like projection when available.
- Outputs communities, clusters, alerts, and propagation chains.

---

### 4.8 app/models/watermark.py
Provenance checks.

Features
- Detects embedded watermarks.
- Generates probabilistic fingerprints if missing.
- Validates timestamped signatures.

---

### 4.9 app/models/sharing.py
Sharing package engine.

Features
- Signed JSON envelope
- Policy tags for privacy/export control
- Multi-hop route simulation with latency

---

### 4.10 app/services/orchestrator.py
Pipeline orchestrator.

Stages
1. ID creation and timestamps.
2. Detection + provenance.
3. Graph ingestion.
4. Storage and audit logs.
5. SSE event emission.

Sharing
- Builds packages and optionally publishes to federated nodes.

---

### 4.11 app/storage/database.py
SQLite persistence.

Tables
- `cases`
- `audit_log`
- `fingerprints`

Notes
- Auto-init and minimal schema evolution.
- Normalized hashing for fuzzy match.

---

### 4.12 app/federated/*
Federated ledger subsystem.

Components
- `ledger.py`: block structure
- `manager.py`: persistence + validation
- `node.py`: peer broadcast
- `crypto.py`: Fernet encryption + Ed25519 signature

Features
- Tamper detection
- Peer validation
- Chain sync for recovery

---

## 5. Frontend Deep Dive (frontend/)

### 5.1 Routes
- `/`: full analyst dashboard
- `/simple`: simplified workflow
- `/superuser`: admin-level monitoring

### 5.2 Main Features
- Live SSE updates
- Intake form with metadata and speech capture
- Case list and detail exploration
- Sharing package generation
- Federated ledger inspection
- Heatmap visualization
- Image analyzer

### 5.3 Key Components
- `IntakeForm`: structured input + region hints + speech capture
- `CaseTable` / `CaseDetail`: triage and forensic drilldown
- `EventsFeed`: SSE updates
- `RadarChart` + `Speedometer`: risk visuals
- `HopTraceMap`: route visualization
- `FederatedBlockchain`: ledger validation and sync
- `WorldHeatmapLeaflet`: geo risk
- `ImageAnalyzer`: AI and moderation signals

### 5.4 Frontend API Layer
- `submitIntake`, `fetchCase`, `requestSharingPackage`, `createEventStream`
- Environment variables for API/node URLs

---

## 6. API Contract Reference (Detailed)

### 6.1 POST /api/v1/intake
Request
```json
{
  "text": "string (min 20 chars)",
  "language": "en",
  "source": "unknown",
  "metadata": {
    "platform": "telegram-channel",
    "region": "Mumbai",
    "actor_id": "actor_123",
    "related_urls": ["https://example.com"]
  },
  "tags": ["disinfo-campaign"]
}
```

Response (DetectionResult)
```json
{
  "intake_id": "uuid",
  "submitted_at": "2025-01-01T00:00:00Z",
  "composite_score": 0.78,
  "classification": "high-risk",
  "breakdown": {
    "linguistic_score": 0.63,
    "behavioral_score": 0.72,
    "ai_probability": 0.85,
    "model_family": "gpt",
    "model_family_confidence": 0.64,
    "ollama_risk": 0.7,
    "stylometric_anomalies": {"entropy": 0.42},
    "heuristics": ["Urgent CTA detected"]
  },
  "provenance": {
    "watermark_present": false,
    "watermark_hash": "abc",
    "signature_valid": false,
    "validation_notes": ["No embedded watermark detected"],
    "content_hash": "sha256..."
  },
  "graph_summary": {
    "node_count": 10,
    "edge_count": 9,
    "high_risk_actors": ["actor::anon::123"],
    "communities": []
  },
  "summary": "High-risk classification for a narrative...",
  "findings": ["Urgent CTA detected"],
  "decision_reason": "Triggered heuristics..."
}
```

Errors
- 400: missing region
- 401/403: permission check failed

---

### 6.2 GET /api/v1/cases/{intake_id}
Returns stored case with full breakdown.

---

### 6.3 POST /api/v1/share
Request
```json
{
  "intake_id": "uuid",
  "destination": "USA",
  "justification": "Joint task force request",
  "include_personal_data": false
}
```

Response (SharingPackage)
```json
{
  "package_id": "pkg-uuid",
  "created_at": "2025-01-01T00:00:00Z",
  "destination": "USA",
  "policy_tags": ["classified:restricted", "privacy:pii-redacted"],
  "payload": {"intake_id": "uuid"},
  "signature": "sha256...",
  "hop_trace": [
    {
      "id": "HOP-1-Mumbai-IN",
      "name": "Analyst Edge Relay",
      "city": "Mumbai, IN",
      "coords": [19.076, 72.8777],
      "ip": "10.0.0.1",
      "provider": "ISP Edge",
      "latency": 22,
      "note": "Forwarding payload via encrypted tunnel."
    }
  ],
  "risk_level": "high-risk",
  "composite_score": 0.78
}
```

Errors
- 404: unknown intake

---

### 6.4 GET /api/v1/events/stream
SSE stream with events:
```
data: {"type":"analysis_completed","intake_id":"uuid","score":0.7}
```

---

### 6.5 Federated Endpoints
- `POST /api/v1/federated/add_block`
- `POST /api/v1/federated/receive_block`
- `GET /api/v1/federated/chain`
- `GET /api/v1/federated/validate`
- `GET /api/v1/federated/validate_local`
- `POST /api/v1/federated/reset_chain`
- `POST /api/v1/federated/sync_chain`
- `GET /api/v1/federated/decrypt_block/{index}`

---

### 6.6 Image Analysis
`POST /api/v1/image/analyze` with multipart form data.

---

## 7. Storage Schema Reference

### 7.1 cases
- intake_id (PK)
- raw_text
- classification
- composite_score
- metadata_json
- breakdown_json
- provenance_json
- summary_text
- decision_reason
- created_at

### 7.2 audit_log
- id (PK)
- intake_id
- action
- actor
- payload
- created_at

### 7.3 fingerprints
- id (PK)
- intake_id
- content_hash
- normalized_hash
- created_at

### 7.4 federated ledger
- idx
- ts
- data_encrypted
- previous_hash
- hash
- signature
- public_key

---

## 8. Environment Variables Reference

Backend
- APP_ENV
- APP_SECRET
- DATABASE_URL
- HF_MODEL_NAME
- HF_TOKENIZER_NAME
- HF_DEVICE
- HF_SCORE_THRESHOLD
- OLLAMA_ENABLED
- OLLAMA_MODEL
- OLLAMA_HOST
- OLLAMA_TIMEOUT
- BLOCK_ENCRYPTION_KEY
- FEDERATED_NODES
- NODE_URL
- SIGHTENGINE_API_USER
- SIGHTENGINE_API_SECRET

Frontend
- NEXT_PUBLIC_API_BASE_URL
- NEXT_PUBLIC_NODE1_URL
- NEXT_PUBLIC_NODE2_URL
- NEXT_PUBLIC_NODE3_URL
- NEXT_PUBLIC_NODE4_URL

---

## 9. Operational Guides

### 9.1 Local Development
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

### 9.2 Multi-node Federation
```bash
docker-compose up --build
```

### 9.3 Tests
```bash
pytest
```

---

## 10. Constraints and Tradeoffs
- SQLite chosen for portability; not optimized for scale.
- Optional AI integrations require large models and GPU for speed.
- Federated ledger is a lightweight simulation, not a full consensus blockchain.

---

## 11. Roadmap Ideas
- Upgrade storage to Postgres or distributed DB.
- Add external social data ingestion.
- Extend to image/video watermark detection.
- Add role-based UI gating.

---

## 12. Feature Index

Backend
- app/main.py
- app/config.py
- app/schemas.py
- app/models/detection.py
- app/models/graph_intel.py
- app/models/watermark.py
- app/models/sharing.py
- app/integrations/hf_detector.py
- app/integrations/ollama_client.py
- app/services/orchestrator.py
- app/storage/database.py
- app/federated/*

Frontend
- frontend/app/page.js
- frontend/app/simple/page.js
- frontend/app/superuser/page.js
- frontend/components/*
- frontend/lib/api.js

Docs
- docs/architecture.md
- docs/FEDERATED_BLOCKCHAIN.md
- docs/OLLAMA_SETUP.md
- docs/OLLAMA_INTEGRATION.md


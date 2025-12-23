# TattvaDrishti - Complete Project Documentation

## 1. Executive Summary
TattvaDrishti is a prototype platform for detecting and mitigating malign information operations. It integrates stylometric heuristics, AI model inference, semantic risk scoring, provenance checks, and graph intelligence into a single pipeline. The system provides a FastAPI backend for ingestion and analysis, and a Next.js frontend for analyst-facing dashboards, real-time updates, and federated sharing workflows.

This document consolidates the entire project in full depth: architecture, modules, features, API contracts, data flow, configuration, and operational notes.

---

## 2. System Goals
- Detect AI-generated and coordinated malicious content.
- Explain the rationale behind classifications with clear heuristics.
- Track provenance and watermark signals for authenticity checks.
- Build a graph of actors, narratives, and regions for intelligence insight.
- Enable federated sharing with tamper-evident logs.
- Provide rich visual dashboards and live monitoring.

---

## 3. High-Level Architecture

### 3.1 Core Components
- **Backend (FastAPI)**: ingestion, analysis orchestration, storage, SSE, sharing, ledger endpoints.
- **AI Integrations**: Hugging Face detection, Ollama semantic scoring (optional).
- **Graph Intel Engine**: builds and summarizes interaction graph.
- **Storage**: SQLite persistence for cases, audit log, fingerprints, and ledger.
- **Frontend (Next.js)**: dashboards, charts, heatmaps, sharing controls.
- **Federated Ledger**: encrypted, signed blocks replicated across nodes.

### 3.2 Data Flow (Primary Intake)
1. Client submits content to `/api/v1/intake`.
2. Orchestrator runs detection + provenance + graph ingestion.
3. Results are stored in SQLite and streamed via SSE.
4. UI consumes SSE to update dashboards in real time.
5. Case detail is retrieved via `/api/v1/cases/{id}`.

### 3.3 Data Flow (Sharing)
1. UI requests `/api/v1/share`.
2. Orchestrator builds policy tags and hop trace.
3. Package is returned to UI and optionally written to ledger.
4. Ledger broadcasts to peer nodes for replication.

---

## 4. Backend Deep Dive (app/)

### 4.1 app/main.py
Responsibilities
- API routing
- SSE stream handler
- Heatmap tracking
- Federated ledger endpoints
- Image analysis endpoint

Key Endpoints
- POST `/api/v1/intake`
- GET `/api/v1/cases/{intake_id}`
- POST `/api/v1/share`
- GET `/api/v1/events/stream`
- GET `/api/v1/integrations/threat-intel`
- GET `/api/v1/integrations/siem`
- Heatmap routes under `/api/v1/heatmap/*`
- Federated ledger routes under `/api/v1/federated/*`
- POST `/api/v1/image/analyze`

Notable Behaviors
- Region is required on intake for heatmap logging.
- SSE is driven by an internal asyncio queue.

---

### 4.2 app/config.py
Defines runtime configuration via environment variables.

Core Settings
- `APP_ENV`: dev/prod behavior (dev bypasses auth)
- `APP_SECRET`: signing secret for sharing packages
- `DATABASE_URL`: SQLite connection

AI Settings
- `HF_MODEL_NAME`, `HF_TOKENIZER_NAME`, `HF_DEVICE`, `HF_SCORE_THRESHOLD`
- `OLLAMA_ENABLED`, `OLLAMA_MODEL`, `OLLAMA_HOST`, `OLLAMA_TIMEOUT`

Federation Settings
- `BLOCK_ENCRYPTION_KEY`
- `FEDERATED_NODES`
- `NODE_URL`

Image Moderation
- `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET`

---

### 4.3 app/schemas.py
Defines data models for the entire system.

Key Models
- `ContentIntake`: text, language, source, metadata
- `DetectionBreakdown`: stylometrics, heuristics, AI metrics
- `DetectionResult`: composite results for UI and storage
- `GraphSummary`, `GNNCluster`, `CoordinationAlert`, `PropagationChain`
- `SharingRequest`, `SharingPackage`

---

### 4.4 app/models/detection.py
Stylometric + heuristic detection engine.

Feature Extraction
- MATTR lexical diversity
- Sentence length variance
- Token burstiness
- Character entropy
- Repetition rate
- Punctuation variety
- Vocabulary richness proxy

Behavioral Heuristics
- Urgency words
- CTA patterns
- High-risk tags and platform boosts

AI Fusion
- Hugging Face AI detector
- Optional model family classifier
- Optional Ollama semantic risk

Outputs
- Composite score
- Classification bucket
- Heuristics list for explainability

---

### 4.5 app/integrations/hf_detector.py
Hugging Face inference pipeline.

Features
- LoRA adapter loading for AI vs Human detection.
- Optional model family classifier.
- Automatic device selection (GPU if available).
- `DISABLE_AI_MODELS` toggle for test mode.

---

### 4.6 app/integrations/ollama_client.py
Semantic risk scoring through Ollama.

Features
- Local LLM call with prompt truncation.
- Strict JSON response parsing and fallback numeric extraction.
- Defensive initialization if Ollama is unavailable.

---

### 4.7 app/models/graph_intel.py
Graph intelligence engine.

Features
- Maintains an in-memory graph with actors, content, narratives, regions.
- Optional torch-backed GNN-style scoring projection.
- Generates community snapshots, clusters, alerts, and propagation chains.

Outputs
- Threat intelligence feed
- SIEM correlation payload

---

### 4.8 app/models/watermark.py
Provenance and watermark verification.

Features
- Detects embedded watermark patterns.
- Generates probabilistic fingerprint if missing.
- Verifies rolling signature tokens.

---

### 4.9 app/models/sharing.py
Sharing package creation.

Features
- Policy tags for privacy and export control.
- Signed package envelope.
- Simulated multi-hop trace with latency and routing metadata.

---

### 4.10 app/services/orchestrator.py
Pipeline orchestrator.

Stages
1. Generate intake id.
2. Run detection, provenance, and graph ingestion.
3. Store results and audit log.
4. Store fingerprints.
5. Emit SSE event.

Sharing
- Builds sharing package from stored case.
- Optionally pushes to destination ledger node.

---

### 4.11 app/storage/database.py
SQLite persistence layer.

Tables
- `cases`: analysis results
- `audit_log`: system actions
- `fingerprints`: hashes for re-identification

Behavior
- Schema initialization on startup
- Normalized text hashing for fuzzy matches

---

### 4.12 app/federated/*
Federated ledger subsystem.

Components
- `ledger.py`: block definition and hashing rules
- `manager.py`: chain storage and validation
- `node.py`: peer broadcast
- `crypto.py`: Fernet encryption + Ed25519 signing

Key Features
- Tamper detection via hash and signature checks
- Peer validation and consensus signals
- Ledger stored in SQLite

---

## 5. Frontend Deep Dive (frontend/)

### 5.1 Frontend App Router
- `/` main analyst dashboard
- `/simple` simplified intake flow
- `/superuser` admin-level control dashboard

### 5.2 Core UI Features
- Live event stream (SSE) with auto-reconnect.
- Case table and detail drill-down.
- Visual metrics (radar chart, speedometer).
- Federated ledger inspection and sync controls.
- Global heatmap visualization.
- Image moderation with configurable signals.

### 5.3 Key Components
- IntakeForm: structured intake + speech capture
- CaseTable / CaseDetail: analysis review
- EventsFeed: SSE feed
- HopTraceMap: sharing route display
- FederatedBlockchain: ledger status and validation
- WorldHeatmapLeaflet: geo risk visualization
- ImageAnalyzer: AI/gore/offensive detection

### 5.4 API Integration (frontend/lib/api.js)
- `submitIntake`
- `fetchCase`
- `requestSharingPackage`
- `createEventStream`

Environment Variables
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_NODE1_URL` ... `NEXT_PUBLIC_NODE4_URL`

---

## 6. Image Analysis Flow
- Endpoint: `/api/v1/image/analyze`
- Uses Sightengine API for genai, violence, gore, and other models.
- Frontend `ImageAnalyzer` composes form data and renders probabilities.

---

## 7. Heatmap Flow
- Heatmap API: `/api/v1/heatmap/add-risk-point` and `/api/v1/heatmap/grid`.
- Points are stored in `data/heatmap_points.json`.
- Frontend uses Leaflet to display map and heat layer.

---

## 8. Security and Privacy
- Role-based access check for key endpoints.
- Sharing payloads redact personal data unless explicit flag set.
- Federated blocks encrypted and signed.
- Provenance checks include watermark and signature validation.

---

## 9. Testing
Tests are located in `tests/`.

- `test_detection.py` validates heuristic scoring.
- `test_sharing.py` validates PII redaction.

Run tests:
```bash
pytest
```

---

## 10. Deployment and Operations

### Backend
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Multi-Node (Federation)
```bash
docker-compose up --build
```

---

## 11. Known Constraints
- SQLite is used for persistence; scaling requires a stronger DB.
- Optional AI integrations require local models and sufficient hardware.
- Federated ledger is a lightweight simulation rather than full consensus blockchain.

---

## 12. Extensibility Roadmap
- Replace heuristic detector with fine-tuned transformer.
- Integrate streaming social APIs for live ingestion.
- Add image/video watermark verification.
- Move to Postgres with async ORM.
- Add role-based UI gating in frontend.

---

## 13. File Index (Feature-Focused)
- Backend
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

- Frontend
  - frontend/app/page.js
  - frontend/app/simple/page.js
  - frontend/app/superuser/page.js
  - frontend/components/*
  - frontend/lib/api.js

- Docs
  - docs/architecture.md
  - docs/FEDERATED_BLOCKCHAIN.md
  - docs/OLLAMA_SETUP.md
  - docs/OLLAMA_INTEGRATION.md


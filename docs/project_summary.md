# LLM MalignOps Shield — Comprehensive Project Summary

## Purpose & Scope
- Provides an end-to-end MVP for detecting, analysing, and sharing intelligence on suspected malign information operations orchestrated by large language models.
- Blends heuristic scoring, ML integrations, provenance checks, graph analytics, and sharing policies, surfacing results through both a FastAPI-powered analyst dashboard (`templates/dashboard.html`) and a standalone Next.js marketing/demo frontend (`frontend/`).

## Core Capabilities
- Narrative ingestion via REST (`POST /api/v1/intake`) with asynchronous event streaming (`/api/v1/events/stream`).
- Hybrid detection engine combining stylometric heuristics, behavioural risk boosts, optional Hugging Face model scoring, and optional Ollama qualitative analysis (`app/models/detection.py`).
- Provenance verification and watermarking heuristics to flag tampering (`app/models/watermark.py`).
- Threat graph enrichment using NetworkX to map actors, regions, and narrative tags (`app/models/graph_intel.py`).
- Policy-aware sharing package generation with deterministic signatures (`app/models/sharing.py`).
- Persistent case storage and audit logging in SQLite (`app/storage/database.py`).

## Tech Stack
- **Backend:** Python 3, FastAPI (`app/main.py`), Pydantic models (`app/schemas.py`), Jinja2 templating, asyncio-based SSE streaming, SQLite persistence, packaged with Uvicorn (`requirements.txt`).
- **Detection Integrations:** Optional Hugging Face transformer pipeline for AI-probability scoring (`app/integrations/hf_detector.py`) and optional Ollama CLI for qualitative risk assessment (`app/integrations/ollama_client.py`).
- **Graph & Analytics:** NetworkX for relationship mapping and community snapshots, standard library heuristics for stylometrics.
- **Frontend (showcase):** Next.js 14, React 18, Tailwind CSS, SWR-based data fetching, EventSource streaming (`frontend/app/page.js`, `frontend/lib/api.js`).
- **Tooling & Tests:** Pytest for backend verification (`tests/test_detection.py`), optional Node.js workflow for the Next.js dashboard.

## Architecture & Data Flow
1. **Intake:** External clients POST suspicious content to `/api/v1/intake` using the `ContentIntake` schema (`app/schemas.py`).
2. **Orchestration:** `AnalysisOrchestrator` (`app/services/orchestrator.py`) fans out work to detection, provenance, graph, and storage layers synchronously inside a FastAPI-managed threadpool.
3. **Detection Pipeline:** `DetectorEngine.detect()` (`app/models/detection.py`) extracts stylometric features, runs heuristics, adds behavioural boosts, and blends them with optional Hugging Face and Ollama probabilities to produce composite scores and classifications.
4. **Provenance:** `WatermarkEngine.verify()` (`app/models/watermark.py`) checks for embedded watermark or signature markers, deriving fallback fingerprints if missing.
5. **Graph Intelligence:** `GraphIntelEngine.ingest()` (`app/models/graph_intel.py`) updates a NetworkX graph linking content, actors, narrative tags, and regions, producing a `GraphSummary`.
6. **Persistence & Audit:** `Database.save_case()` and `Database.log_action()` (`app/storage/database.py`) write case data and audit events into SQLite (`data/app.db`), ensuring tables exist on startup.
7. **Event Stream:** Orchestrator pushes analysis-completed events onto an asyncio queue, streamed via `/api/v1/events/stream` to power live dashboards.
8. **Case Retrieval & Sharing:** REST endpoints expose historical cases (`GET /api/v1/cases/{intake_id}`) and policy-tagged sharing packages (`POST /api/v1/share`).

## Backend Implementation Highlights
- **Feature Extraction:** Token statistics (average token length, type-token ratio, hapax ratio), burstiness windows, uppercase rates, function-word coverage, and sentence length variance feed a weighted linear model with sigmoid activation.
- **Heuristics:** Flags based on burstiness, lexical diversity, uppercase usage, threat-tag overlaps, suspect platforms, and high human-likeness signatures; heuristics appended to the result breakdown for analyst transparency.
- **Score Blending:** Weighted aggregation of base stylometric score (0.5 weight), Hugging Face probability (0.35), and Ollama risk (0.15) with graceful handling when integrations are disabled.
- **Behavioural Boosts:** Additional risk when metadata indicates high-risk regions (RU, IR, KP) or tracked influence tags.
- **Classification Thresholds:** `high-risk` ≥ 0.75, `medium-risk` ≥ 0.45, `low-risk` otherwise.
- **Watermark Checks:** Regex-driven detection of embedded watermark (`[[WM::{hash}]]`) and signature tokens (`[[SIG::{id}]]`), plus derived SHA-256-based fingerprints tied to `WATERMARK_SEED`.
- **Graph Summaries:** Maintains actor/content/tag/region nodes, calculates high-risk actors by averaging neighbour scores, and snapshots connected communities for situational awareness.
- **Sharing Engine:** Generates signed JSON envelopes, redacts PII unless `include_personal_data` is true, and applies jurisdictional policy tags (e.g., export control, privacy) plus justification hash.

## API Surface
- `POST /api/v1/intake` → Accepts `ContentIntake`; returns `DetectionResult` including composite score, classification, breakdown, provenance, and graph summary.
- `GET /api/v1/cases/{intake_id}` → Fetches persisted case, rehydrates graph summary, responds with `DetectionResult`.
- `POST /api/v1/share` → Takes `SharingRequest` and returns a signed `SharingPackage` (policy tags, payload, signature).
- `GET /api/v1/events/stream` → Server-Sent Events feed emitting orchestrated pipeline updates.
- `/` → Analyst dashboard (Jinja/Tailwind) for quick manual testing.

### Backend Modules & Key Classes
- `app/main.py` wires FastAPI routes, server-sent events, and middleware, instantiating a singleton `AnalysisOrchestrator` plus SQLite-backed `Database`.
- `app/services/orchestrator.py` coordinates detection, provenance verification, NetworkX ingestion, audit logging, sharing package creation, and an asyncio queue (maxsize 200) for SSE broadcasting. Blocking pipeline work executes in a threadpool (`run_in_threadpool`) to keep the event loop responsive.
- `app/models/detection.py` implements `DetectorEngine` with stylometric extraction, normalization, linear-weight scoring, heuristics, and blending with ML integrations. Key constants include `SUSPECT_PLATFORMS`, `HIGH_RISK_TAGS`, and `FUNCTION_WORDS`. Weighted coefficients (`avg_token_length` 0.9, `type_token_ratio` -1.3, etc.) mimic a trained linear classifier with bias -0.4.
- `app/models/watermark.py` exposes `WatermarkEngine.verify()`, using regex (`[[WM::hash]]`, `[[SIG::ID]]`) and SHA-256/SHA-1 digests seeded by `WATERMARK_SEED` and `APP_SECRET` to validate provenance.
- `app/models/graph_intel.py` holds `GraphIntelEngine`, storing actor/content/tag/region nodes, generating high-risk actor rankings via neighbour averaging, and summarising connected components as community snapshots.
- `app/models/sharing.py` defines `SharingEngine` generating signed JSON envelopes, JSON-stringifying nested payloads, and tagging packages based on destination and privacy policy.
- `app/storage/database.py` materialises tables `cases` and `audit_log` on startup, serialises payloads as JSON, and exposes helpers for case persistence and audit insertion. Database path defaults to `data/app.db`.
- `app/integrations/hf_detector.py` and `ollama_client.py` wrap optional external models, providing graceful fallbacks and logging.

## Configuration & Secrets
- Centralised via `Settings` (`app/config.py`), loading from `.env` when present.
- Key environment variables include `DATABASE_URL`, `HF_MODEL_NAME`, `HF_TOKENIZER_NAME`, `HF_DEVICE`, `HF_SCORE_THRESHOLD`, `OLLAMA_ENABLED`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT`, and `WATERMARK_SEED`.
- Sample `.env` enables Hugging Face detector on GPU and turns on Ollama risk scoring with custom timeout.

## Data, Storage & Audit
- SQLite database at `data/app.db` (auto-created) stores cases with full payload, breakdown, provenance, and timestamps.
- Audit log table captures application actions (analysis completions, package generation) for compliance tracing.
- Sample intake payload provided in `samples/intake_example.json` for quick manual testing.

### Database Schema Details
- `cases` table columns: `intake_id` (PK), `raw_text`, `classification`, `composite_score`, `metadata_json`, `breakdown_json`, `provenance_json`, `created_at` (ISO string).
- `audit_log` columns: autoincrement `id`, `intake_id`, `action`, `actor`, `payload` (JSON), `created_at`.
- Writes are dispatched via context-managed SQLite connections with autocommit; directories for the DB are auto-created.

## Frontend Experiences
- **FastAPI Dashboard (`templates/dashboard.html`):** HTMX-free Tailwind interface that submits intakes, renders live SSE event feed, and lists recent analyses via vanilla JS.
- **Next.js Dashboard (`frontend/app/page.js`):**
  - Client-side React app showcasing landing hero, metrics, intake form, streaming events, case drill-down, and sharing package generation.
  - API helper (`frontend/lib/api.js`) centralises REST calls and SSE connections, supporting configurable base URL via `NEXT_PUBLIC_API_BASE_URL`.
  - Component library in `frontend/components/` (MetricCard, IntakeForm, CaseTable, CaseDetail, EventsFeed, Toast) emphasises productised analyst workflows.

### Frontend Component Details
- `IntakeForm.jsx` enforces a 20-character minimum narrative, normalises metadata fields, and resets state on successful submission.
- `CaseTable.jsx` renders session-scoped analyses with formatted timestamps and highlighted selection states.
- `CaseDetail.jsx` visualises detection breakdown (score bars for linguistic/behavioural/HF/Ollama), stylometric anomalies, heuristics, provenance notes, graph metrics, original submission metadata, and sharing controls (default justification + destination picker).
- `EventsFeed.jsx` consumes the SSE stream, displaying live badges, score readouts, and timestamps with animated “streaming” indicator.
- `MetricCard.jsx` and `Toast.jsx` deliver UI primitives for headline metrics and transient notifications.
- Global styling is defined through Tailwind (via `frontend/app/globals.css` and `tailwind.config.js`); layout orchestrated in `frontend/app/layout.js`.

## Testing & Quality
- Pytest suite currently covers `DetectorEngine` heuristics-only execution (`tests/test_detection.py`), ensuring classification and breakdown outputs stay within expected bounds when ML integrations are disabled.
- Hugging Face integration gracefully degrades when models are unavailable, logged via `logging` warnings.

### Additional Quality Safeguards
- `tests/test_detection.py` explicitly disables Hugging Face via env vars to validate heuristic fallback pathways.
- `AnalysisOrchestrator` drops oldest SSE events if the queue is full, preventing backpressure.
- `OllamaClient` limits prompt size (1200 chars), enforces CLI timeout, and attempts JSON recovery from unstructured model responses.

## Integrations & Model Usage
- **Hugging Face:** Defaults to `roberta-base-openai-detector` for AI-vs-human classification; configurable via `HF_MODEL_NAME`/`HF_TOKENIZER_NAME`. Uses `transformers.pipeline` with optional GPU (`HF_DEVICE`) and supports local path overrides. Machine-generated probability extracted by scanning labels for `LABEL_1`, `AI`, `LLM`, etc.
- **Ollama:** Optional local model (default `mistral`; sample `.env` uses `gemma3n:e4b`) providing qualitative risk JSON (`{ "risk": float, "justification": str }`). CLI invoked with configurable timeout, disabled unless `OLLAMA_ENABLED=true`.
- **Stylometric Model:** Heuristic linear blend combining feature weights (`avg_token_length` 0.9, `burstiness` 1.2, `type_token_ratio` -1.3, `sentence_length_var` 0.8, `function_word_ratio` -0.7, `uppercase_ratio` 0.6) plus bias (-0.4) and hapax penalty/bonus adjustments. Sigmoid transforms produce interpretable [0,1] scores.
- **Behavioural Rules:** Region risk boost (+0.15 for RU/IR/KP), tag-based increments (+0.05 per high-risk tag capped at +0.5). Classification thresholds: high (≥0.75), medium (≥0.45), low (<0.45).

## Detection Heuristics & Feature Engineering
- Tokenisation via regex `\b\w+\b`; burstiness measured in 10-token windows; sentence variance computed with `statistics.variance`.
- Feature normalisation clamps metrics to defensible ranges (e.g., `avg_token_length/8 ≤ 1.5`, tanh-squashed sentence variance).
- Human-likeness bonus up to 0.28 for high type-token ratios (>0.52), hapax ratio (>0.38), function-word coverage (>0.14), and rich sentence variance (>35).
- Heuristics triggered for high burstiness (>0.65), low lexical diversity (<0.35), uppercase spikes (>0.12), multiple URLs (>3 `http` occurrences), suspect platforms, tracked narratives, or convincing human stylometry (balanced lexical stats).
- Detection breakdown surfaces stylometric anomaly readings (rounded to 3 decimals) and heuristic strings for analyst transparency.

## Development & Operations
- **Backend Workflow:** `python3 -m venv .venv`, `pip install -r requirements.txt`, then `uvicorn app.main:app --reload`.
- **Frontend Workflow:** `cd frontend`, `npm install`, `npm run dev` (expects backend at `http://localhost:8000` or override with `NEXT_PUBLIC_API_BASE_URL`).
- SSE stream, database files, and optional Ollama subprocess calls run locally; no external queueing system required for MVP.

## Extensibility & Roadmap
- Architecture doc (`docs/architecture.md`) outlines future enhancements: swapping to fine-tuned detectors, integrating live intel feeds, blockchain-backed sharing receipts, and multimodal watermarking.
- Orchestrator and model abstractions are designed for drop-in replacement of detection engines, graph analytics, and sharing policy modules without altering the FastAPI interface.

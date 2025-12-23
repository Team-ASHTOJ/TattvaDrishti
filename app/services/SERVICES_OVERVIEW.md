# Services Module Overview (app/services/)

Purpose
- Orchestrate the end-to-end detection pipeline and handle cross-module coordination.

Key component
- orchestrator.py: synchronous analysis workflow wrapped for async FastAPI usage.

What it does
- Generates intake IDs and timestamps.
- Runs detection, watermark verification, and graph ingestion.
- Stores cases, audit events, and fingerprints.
- Builds sharing packages and optionally publishes to federated ledger.
- Streams live events for SSE dashboards.

Skill highlights
- Modular pipeline architecture with clean separation of concerns.
- Async-safe execution via run_in_threadpool.
- Federation-aware sharing that can sync between nodes.

Libraries used
- httpx, asyncio, uuid, datetime
- fastapi.concurrency

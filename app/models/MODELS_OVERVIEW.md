# Models Module Overview (app/models/)

Purpose
- Implement the core intelligence engines that power analysis, provenance, graphing, and sharing.

Key engines
- detection.py: stylometric + behavioral heuristics, AI detection fusion, and composite scoring.
- graph_intel.py: graph ingestion, GNN-style projection, and threat intelligence summaries.
- watermark.py: provenance checks via watermark and signature patterns.
- sharing.py: secure sharing packages with routing hop traces and policy tags.

Feature highlights
- Rich stylometric extraction (MATTR, entropy, repetition, punctuation variety).
- Behavioral cues for urgency and manipulation detection.
- Graph intelligence snapshots for communities, clusters, and propagation chains.
- Share packages signed with secret key and enriched with hop traces.

Libraries used
- networkx, torch (optional), statistics, hashlib
- pydantic models from app/schemas.py

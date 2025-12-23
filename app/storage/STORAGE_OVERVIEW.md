# Storage Module Overview (app/storage/)

Purpose
- Provide a lightweight SQLite persistence layer for cases, audit logs, and fingerprints.

What it does
- Initializes and migrates schema on startup.
- Stores analysis results, metadata, and provenance details.
- Tracks audit actions for each intake.
- Saves normalized fingerprints for re-identification checks.

Design signals
- Minimal ORM-free approach for portability and clarity.
- Idempotent schema creation with incremental column adds.
- Normalized hash strategy for fuzzy text matching.

Libraries used
- sqlite3, hashlib, json, pathlib

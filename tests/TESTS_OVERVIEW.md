# Tests Overview (tests/)

Purpose
- Validate the core detection pipeline and sharing safeguards.

Coverage
- test_detection.py: verifies heuristic scoring paths and classification bounds.
- test_sharing.py: ensures PII masking in sharing payloads.

Quality signals
- Disables heavyweight AI models for deterministic unit tests.
- Exercises orchestration logic without external services.

Libraries used
- pytest

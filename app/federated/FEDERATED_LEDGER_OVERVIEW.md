# Federated Ledger Module Overview (app/federated/)

Purpose
- Maintain a tamper-evident ledger for cross-node intelligence sharing.

Components
- ledger.py: block structure and hashing/signing rules.
- manager.py: chain storage, validation, and reset logic.
- node.py: peer discovery and block broadcast.
- crypto.py: encryption (Fernet) and Ed25519 signing/verification.

Features that show depth
- Canonical payload hashing to keep signatures deterministic.
- Block verification via previous-hash and signature checks.
- On-disk chain storage for node restart resilience.
- Peer sync logic to recover from tampering.

Libraries used
- cryptography (Fernet, Ed25519)
- sqlite3
- requests

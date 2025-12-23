# Federated Ledger Module Overview (app/federated/)

## Purpose
Provide a tamper-evident ledger for cross-node intelligence sharing with encrypted payloads and signature verification.

## Core Components
- ledger.py: block structure and canonical payload hashing.
- manager.py: persistence, validation, and reset logic.
- node.py: peer discovery and block broadcasting.
- crypto.py: Fernet encryption + Ed25519 signing/verification.

## Block Structure
- index
- timestamp
- data_encrypted
- previous_hash
- hash
- signature
- public_key

## How It Works
1. Payload is encrypted using Fernet.
2. Block is created with canonical JSON payload for deterministic hashing.
3. Hash is computed and signed with Ed25519.
4. Block is stored in SQLite.
5. Block is broadcast to peer nodes for replication.

## Validation Rules
- previous_hash must match the prior block.
- hash must match the canonical payload hash.
- signature must verify against the public key.

## Persistence
- data/federated_ledger.db
- Genesis block is created on first run.

## Environment Variables
- BLOCK_ENCRYPTION_KEY
- FEDERATED_NODES
- NODE_URL

## Dependencies
- cryptography (Fernet, Ed25519)
- sqlite3
- requests

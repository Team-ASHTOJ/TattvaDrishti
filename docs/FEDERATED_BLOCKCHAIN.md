# Federated Intelligence Sharing - Blockchain Implementation

## Overview

This implementation provides a **tamper-proof, federated blockchain-based intelligence sharing system** that enables secure cross-border data exchange between allied nations while complying with data localization and privacy laws.

## Features

✅ **Blockchain-based audit trail** - Immutable record of all intelligence sharing activities  
✅ **Ed25519 cryptographic signatures** - Each block is cryptographically signed for authenticity  
✅ **Fernet encryption** - All shared data is encrypted before being added to the blockchain  
✅ **Peer-to-peer synchronization** - Automatic block broadcasting to all federated nodes  
✅ **Consensus validation** - Network-wide validation to detect tampering  
✅ **RESTful API** - Standard HTTP endpoints for easy integration  
✅ **Real-time frontend visualization** - Live blockchain status and validation

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Node 1 (USA)  │◄────►│   Node 2 (EU)   │◄────►│   Node 3 (IN)   │
│   Port: 8001    │      │   Port: 8002    │      │   Port: 8003    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   Node 4 (AUS)  │
                         │   Port: 8004    │
                         └─────────────────┘
```

## Quick Start

### 1. Single Node Mode (Development)

```bash
# Install dependencies
pip install -r requirements.txt

# Start backend
source .venv-py311/bin/activate
uvicorn app.main:app --reload

# Start frontend
cd frontend
npm run dev
```

Visit http://localhost:3001 to see the blockchain visualization.

### 2. Multi-Node Mode (Production Simulation)

```bash
# Build and start 4 federated nodes
docker-compose up --build

# Nodes will be available at:
# Node 1 (USA):  http://localhost:8001
# Node 2 (EU):   http://localhost:8002
# Node 3 (IN):   http://localhost:8003
# Node 4 (AUS):  http://localhost:8004
```

## API Endpoints

### Add Block to Ledger
```bash
POST /api/v1/federated/add_block
Content-Type: application/json

{
  "type": "intelligence_sharing",
  "classification": "high-risk",
  "destination": "EU",
  "data": {...}
}
```

### Receive Block from Peer
```bash
POST /api/v1/federated/receive_block
Content-Type: application/json

{
  "index": 2,
  "timestamp": 1733353200.0,
  "data_encrypted": "...",
  "previous_hash": "abc123...",
  "hash": "def456...",
  "signature": "...",
  "public_key": "..."
}
```

### Get Full Blockchain
```bash
GET /api/v1/federated/chain

Response:
{
  "chain": [...],
  "length": 5
}
```

### Validate Local Chain
```bash
GET /api/v1/federated/validate_local

Response:
{
  "valid": true
}
```

### Validate Network Consensus
```bash
GET /api/v1/federated/validate

Response:
{
  "self_valid": true,
  "nodes": {
    "http://node1:8000": true,
    "http://node2:8000": true,
    "http://node3:8000": false
  },
  "network_valid": false,
  "tampered_nodes": ["http://node3:8000"],
  "chain_length": 12
}
```

### Decrypt Block Data
```bash
GET /api/v1/federated/decrypt_block/{block_index}

Response:
{
  "block_index": 3,
  "data": {
    "type": "intelligence_sharing",
    "package_id": "uuid-here",
    "destination": "USA",
    "classification": "critical-risk",
    "composite_score": 0.87,
    "timestamp": "2025-12-05T10:30:00Z",
    "policy_tags": ["classified:restricted"]
  }
}
```

## How It Works

### 1. **Block Creation**
When a sharing package is generated via `/api/v1/share`, the system:
- Encrypts the intelligence payload using Fernet symmetric encryption
- Creates a new block with the encrypted data
- Computes SHA-256 hash of the block's canonical payload
- Signs the hash using Ed25519 private key
- Saves the block to the local ledger

### 2. **Peer Broadcasting**
After creating a block:
- The node broadcasts it to all configured peer nodes
- Peers validate the block before accepting it
- Each peer stores a synchronized copy

### 3. **Validation**
Blocks are validated by checking:
- **Index continuity**: Block index = previous index + 1
- **Hash linkage**: Block's previous_hash matches previous block's hash
- **Hash integrity**: Recomputed hash matches stored hash
- **Signature authenticity**: Ed25519 signature verification

### 4. **Tamper Detection**
If any block is altered:
- Hash recomputation will fail
- Signature verification will fail
- Network validation will flag the tampered node

## Configuration

### Environment Variables

```bash
# Blockchain encryption key (must be same across all nodes for decryption)
BLOCK_ENCRYPTION_KEY="LULSnIHlBjTSfWDfqVl0kTV9qXUFN0EpGbynAB_34TM="

# Comma-separated list of peer nodes
FEDERATED_NODES="http://node1:8000,http://node2:8000,http://node3:8000"

# This node's public URL
NODE_URL="http://node1:8000"

# Database path (each node should have separate DB)
DATABASE_URL="sqlite:///./data/app_node1.db"
```

### Generate New Encryption Key

```python
from cryptography.fernet import Fernet
key = Fernet.generate_key()
print(key.decode())  # Use this as BLOCK_ENCRYPTION_KEY
```

## Security Considerations

### ✅ What's Protected
- **Data confidentiality**: All payloads encrypted with Fernet (AES-128)
- **Data integrity**: SHA-256 hashing ensures blocks haven't been modified
- **Non-repudiation**: Ed25519 signatures prove block authorship
- **Tamper detection**: Network consensus reveals compromised nodes

### ⚠️ Production Recommendations
1. **Key Management**: Use HSM or key management service instead of env vars
2. **TLS/mTLS**: Enable HTTPS and mutual TLS between nodes
3. **Access Control**: Add authentication/authorization to blockchain endpoints
4. **Rate Limiting**: Prevent spam block creation
5. **Persistence**: Use production-grade DB (PostgreSQL) instead of SQLite
6. **Monitoring**: Log all block additions and validation failures
7. **Backup**: Regular blockchain snapshots and replication

## Frontend Features

The blockchain dashboard shows:
- **Real-time block list** with hash, signature, and timestamp
- **Network validation status** (valid/tampered)
- **Consensus indicator** across all federated nodes
- **Chain length** and block details
- **Auto-refresh** every 5 seconds

## Testing

### Test Block Creation
```bash
curl -X POST http://localhost:8000/api/v1/federated/add_block \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "message": "Hello from Node 1",
    "timestamp": "2025-12-05T10:00:00Z"
  }'
```

### Validate Chain
```bash
curl http://localhost:8000/api/v1/federated/validate | jq
```

### View Blockchain
```bash
curl http://localhost:8000/api/v1/federated/chain | jq
```

## Troubleshooting

### Issue: "Block validation failed"
**Cause**: Incoming block doesn't link to local chain  
**Solution**: Check if nodes are in sync; may need chain reconciliation

### Issue: "Decryption failed"
**Cause**: Different encryption keys across nodes  
**Solution**: Ensure all nodes use the same `BLOCK_ENCRYPTION_KEY`

### Issue: "Tampered nodes detected"
**Cause**: A node's blockchain has been modified  
**Solution**: Investigate the flagged node; restore from backup if needed

## Integration with Sharing Flow

When you create a sharing package:

```python
# 1. User requests sharing package
POST /api/v1/share
{
  "intake_id": "abc123",
  "destination": "EU",
  "justification": "Counter-terrorism intel",
  "include_personal_data": false
}

# 2. System automatically:
# - Creates sharing package
# - Encrypts intelligence payload
# - Adds block to federated ledger
# - Broadcasts to EU nodes
# - Returns signed package

# 3. EU nodes:
# - Receive block
# - Validate signature
# - Store in local ledger
# - Decrypt payload when authorized
```

## License & Compliance

This implementation is designed to meet:
- **GDPR** (EU data protection)
- **Data localization laws** (Russia, China, India)
- **CISA** (US cybersecurity information sharing)
- **NIST Blockchain Standards**

All data is encrypted and nodes only store metadata; actual intelligence stays sovereign.

---

**Need help?** Check the API documentation or contact the development team.

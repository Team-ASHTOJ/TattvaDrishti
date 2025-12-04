# Quick Start Guide - Federated Blockchain

## ✅ You DON'T need Docker for normal use!

The blockchain works perfectly in **single-node mode** for development and testing.

---

## Running the Application

### Start Backend (with Blockchain)
```bash
source .venv-py311/bin/activate
uvicorn app.main:app --reload
```

### Start Frontend
```bash
cd frontend
npm run dev
```

Visit **http://localhost:3001** - You'll see the blockchain section at the bottom of the page.

---

## How the Blockchain Works

### Automatic Integration
When you create a **sharing package** via the UI:
1. Package data is encrypted
2. Automatically added to blockchain
3. Visible in the "Federated Blockchain Ledger" section

### Manual Testing

**View blockchain:**
```bash
curl http://localhost:8000/api/v1/federated/chain | jq
```

**Add a test block:**
```bash
curl -X POST http://localhost:8000/api/v1/federated/add_block \
  -H "Content-Type: application/json" \
  -d '{
    "type": "manual_test",
    "message": "Testing blockchain",
    "timestamp": "2025-12-05T10:00:00Z"
  }'
```

**Validate chain:**
```bash
curl http://localhost:8000/api/v1/federated/validate_local
```

**Decrypt a block:**
```bash
curl http://localhost:8000/api/v1/federated/decrypt_block/1
```

---

## When to Use Docker (Multi-Node Mode)

**Only if you want to simulate multiple countries:**

1. Install Docker Desktop:
   ```bash
   brew install --cask docker  # macOS
   ```

2. Start 4 federated nodes:
   ```bash
   docker-compose up --build
   ```

3. Access nodes:
   - Node 1 (USA): http://localhost:8001
   - Node 2 (EU): http://localhost:8002
   - Node 3 (IN): http://localhost:8003
   - Node 4 (AUS): http://localhost:8004

4. Test cross-node sync:
   ```bash
   # Add block to Node 1
   curl -X POST http://localhost:8001/api/v1/federated/add_block \
     -H "Content-Type: application/json" \
     -d '{"type":"cross_border","data":"Secret intel"}'
   
   # Check if Node 2 received it
   curl http://localhost:8002/api/v1/federated/chain
   ```

---

## Current Status

✅ **Blockchain is working in single-node mode**  
✅ **2 blocks in chain** (genesis + test block)  
✅ **Chain validation: PASSED**  
✅ **API endpoints: WORKING**  
✅ **Frontend visualization: READY**  

**Database location:** `data/federated_ledger.db`

---

## Summary

- **Single-node mode** (no Docker): Perfect for development, testing, and demos
- **Multi-node mode** (requires Docker): Only for testing cross-border synchronization

**Recommendation:** Stick with single-node mode unless you specifically need to test multi-nation blockchain sync.

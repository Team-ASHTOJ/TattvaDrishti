# Intelligence Sharing Architecture

## Overview

The system uses a **centralized main API with federated blockchain** architecture for intelligence sharing.

## Architecture

```
┌─────────────┐
│  Frontend   │
│ (Port 3000) │
└──────┬──────┘
       │
       │ ALL API requests go to main API
       ▼
┌─────────────────────┐
│   Main API          │
│  (Port 8000)        │◄──┐
│  - Intake processing│   │
│  - Case storage     │   │ Syncs blockchain
│  - Sharing packages │   │
│  - Blockchain master│   │
└──────┬──────────────┘   │
       │                  │
       │ Publishes to     │
       ▼                  │
┌──────────────────────────┤
│  Federated Blockchain    │
│  (All 4 nodes)           │
├──────────────────────────┤
│  Node 1 (USA)  - 8001   │
│  Node 2 (EU)   - 8002   │
│  Node 3 (IN)   - 8003   │
│  Node 4 (AUS)  - 8004   │
└──────────────────────────┘
```

## Data Flow

### 1. Submit Intake
- **Endpoint**: `POST /api/v1/intake` on main API (port 8000)
- **Action**: Analyzes content, stores in main DB
- **Result**: Case created with unique `intake_id`

### 2. Generate Sharing Package
- **Endpoint**: `POST /api/v1/share` on main API (port 8000)
- **Destination**: USA, EU, IN, or AUS (labels only, routing happens internally)
- **Action**:
  1. Fetches case from main DB
  2. Creates signed sharing package
  3. **Publishes encrypted block to federated blockchain**
  4. Blockchain automatically syncs to all 4 nodes
- **Result**: Package with signature + blockchain entry

### 3. Blockchain Validation
- **Endpoint**: `GET /api/v1/federated/validate` on any node
- **Action**: Validates chain integrity across all nodes
- **Result**: Network consensus status

## Key Points

✅ **All frontend requests go to main API** (localhost:8000)
- Intake submission
- Case retrieval
- Sharing package generation

✅ **Destination dropdown (USA/EU/IN/AUS) is metadata only**
- Sets the `destination` field in the sharing package
- Does NOT route to different nodes
- Used for policy tags and audit trails

✅ **Federated nodes (8001-8004) handle blockchain only**
- Receive blockchain updates from main API
- Maintain synchronized ledger
- Validate chain integrity
- DO NOT handle intake or sharing requests directly

✅ **Data sovereignty**
- Sharing packages include `destination` and `policy_tags`
- Blockchain records are encrypted
- Each sharing event is immutably recorded
- Tamper detection via chain validation

## Database Structure

### Main API Database (data/app.db)
- `cases` - All analyzed content
- `audit_log` - All actions
- `fingerprints` - Content deduplication
- `federated_ledger` - Blockchain blocks

### Node Databases (data/node{1-4}/app.db)
- `federated_ledger` - Synchronized blockchain replica
- **Empty** `cases` table (not used)

## Testing

### Generate a sharing package
```bash
# Get a case ID
CASE_ID=$(sqlite3 data/app.db "SELECT intake_id FROM cases LIMIT 1;")

# Create sharing package
curl -X POST http://localhost:8000/api/v1/share \
  -H "Content-Type: application/json" \
  -d "{
    \"intake_id\": \"$CASE_ID\",
    \"destination\": \"USA\",
    \"justification\": \"Partner intelligence sharing\",
    \"include_personal_data\": false
  }"
```

### Validate blockchain
```bash
curl http://localhost:8000/api/v1/federated/validate | python3 -m json.tool
```

### Check any node's blockchain
```bash
curl http://localhost:8001/api/v1/federated/chain  # USA node
curl http://localhost:8002/api/v1/federated/chain  # EU node
curl http://localhost:8003/api/v1/federated/chain  # IN node
curl http://localhost:8004/api/v1/federated/chain  # AUS node
```

All should return identical chains (synchronized).

## Frontend Implementation

**File**: `frontend/lib/api.js`

```javascript
// ALL requests go to main API
export const API_BASE_URL = "http://localhost:8000";

export async function requestSharingPackage(payload) {
  // Always use main API - it has the case data
  const res = await fetch(`${API_BASE_URL}/api/v1/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
```

## Troubleshooting

### "Unknown intake reference" error
**Cause**: Trying to share a case that doesn't exist
**Fix**: 
1. Check case exists: `sqlite3 data/app.db "SELECT intake_id FROM cases;"`
2. Use a valid `intake_id` from the cases table

### "404 Not Found" on /api/v1/share
**Cause**: Frontend was routing to federated nodes instead of main API
**Fix**: Already applied - all requests go to `localhost:8000`

### Blockchain out of sync
**Cause**: Network communication failure between nodes
**Fix**: Restart docker containers: `docker compose restart`

### Database locked errors
**Cause**: Multiple processes accessing SQLite
**Fix**: Use the main API exclusively; nodes sync automatically

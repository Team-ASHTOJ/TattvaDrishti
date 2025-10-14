# LLM MalignOps Shield — MVP

Prototype platform to detect and mitigate malign information operations powered by large language models. Combines heuristics, Hugging Face detectors, optional Ollama-assisted analysis, threat graph intelligence, provenance checks, and federated sharing scaffolding.

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000 to access the analyst dashboard.

## Frontend Showcase Dashboard (Next.js)

The repository now includes a standalone marketing-grade dashboard built with Next.js + Tailwind in `frontend/`. It talks to the FastAPI backend through the public REST surface, so no server code changes are required.

```bash
cd frontend
npm install
npm run dev
```

The app expects the API to be reachable at `http://localhost:8000` by default. To point at a different backend, set `NEXT_PUBLIC_API_BASE_URL` before running `npm run dev`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://shield.example.com npm run dev
```

Key experiences showcased:

- Live ingestion form that posts to `/api/v1/intake`
- Real-time event stream over `/api/v1/events/stream`
- Case drill-down that hydrates via `/api/v1/cases/{intake_id}`
- One-click sharing package generation via `/api/v1/share`

### Sample Intake

```bash
curl -X POST http://127.0.0.1:8000/api/v1/intake \
  -H "Content-Type: application/json" \
  -d @samples/intake_example.json
```

## Hugging Face GPU Detector

1. **Model prep** (offline-friendly): download once and cache locally.
   ```bash
   python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
tokenizer = AutoTokenizer.from_pretrained('roberta-base-openai-detector'); \
model = AutoModelForSequenceClassification.from_pretrained('roberta-base-openai-detector')"
   ```
   To point at a custom or fine-tuned model directory, set environment variables:
   ```bash
   export HF_MODEL_NAME=/path/to/model
   export HF_TOKENIZER_NAME=/path/to/model
   export HF_DEVICE=0  # GPU id or -1 for CPU
   ```

2. **Run with GPU**: ensure PyTorch detects your CUDA device (`python -c "import torch; print(torch.cuda.is_available())"`).

3. **Threshold tuning** (default 0.6):
   ```bash
   export HF_SCORE_THRESHOLD=0.55
   ```

## Optional Ollama Integration

Enable qualitative risk scoring through a local Ollama model (e.g., `mistral`, `codellama`, or a fine-tuned guard model).

```bash
ollama pull mistral
export OLLAMA_ENABLED=true
export OLLAMA_MODEL=mistral
export OLLAMA_TIMEOUT=20  # seconds
```

The detector will prompt the model for a JSON risk rating (0-1) and blend it with heuristics/Hugging Face probabilities.

## Testing

```bash
pytest
```

## API Reference

- `POST /api/v1/intake` — analyse content.
- `GET /api/v1/cases/{intake_id}` — retrieve stored case summary.
- `POST /api/v1/share` — generate a federated sharing package.
- `GET /api/v1/events/stream` — Server-Sent Events feed for live updates.

## Data & Storage

SQLite database stored at `data/app.db` (configurable via `DATABASE_URL`).

## Extending the MVP

- Swap the Hugging Face model for a proprietary fine-tuned detector.
- Enrich graph intelligence with live social telemetry.
- Integrate blockchain-backed sharing receipts.
- Add automated remediation playbooks triggered by high-risk scores.

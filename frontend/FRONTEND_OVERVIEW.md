# Frontend Module Overview (frontend/)

## Purpose
Deliver analyst-grade dashboards for ingestion, triage, and federated intelligence monitoring.

## Experiences
- Main dashboard: full analysis workflow with sharing and detailed case views.
- Simple dashboard: lightweight interface for quick checks.
- Superuser dashboard: federation, heatmaps, and monitoring.

## Data Flow
- Intake submitted to the API.
- SSE stream hydrates live events and case list.
- Case detail fetches per-intake data.
- Sharing package requests push to federated nodes.

## Feature Highlights
- Multi-signal risk visualizations (radar, dial, cards).
- Live event stream and auto-reconnect behavior.
- Federated ledger inspection with node selection.
- Heatmap visualization for regional risk.
- Image analysis with configurable signal toggles.

## Dependencies
- next, react
- tailwindcss
- leaflet, leaflet.heat
- swr

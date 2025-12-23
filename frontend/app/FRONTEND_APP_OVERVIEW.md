# Frontend App Router Overview (frontend/app/)

## Purpose
Define user-facing routes and page-level layouts using the Next.js App Router.

## Pages
- page.js: advanced analyst dashboard
  - intake submission
  - case table + case detail
  - sharing package generation
  - live SSE events
  - charts and risk visuals

- simple/page.js: guided quick-check dashboard
  - simplified intake and metrics
  - case hydration via SSE
  - reduced visual density

- superuser/page.js: admin console
  - federated blockchain control
  - global heatmap visualization
  - network topology view

## Layout and Styling
- layout.js: root metadata and global shell
- globals.css: base Tailwind layers and custom classes

## UX Principles
- Multiple tiers of complexity to serve different roles.
- Live data first, with resilient reconnect logic.
- Visual hierarchy optimized for at-a-glance decisions.

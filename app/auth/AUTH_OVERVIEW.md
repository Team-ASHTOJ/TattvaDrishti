# Auth Module Overview (app/auth/)

## Purpose
Provide a simple role-based access control layer for API routes without the overhead of a full auth system.

## How It Works
- Requests include a user identifier via header or query parameter.
- The role service maps users to a fixed permission set.
- The middleware enforces required permissions per route.
- In development mode, access is allowed to reduce friction.

## Files
- middleware.py: permission gate used by API routes.
- user_role_service.py: roles, users, and permission sets.

## Permissions Model
- Role.GUEST: upload
- Role.L1: upload
- Role.L2: upload + dashboard

## Dev Mode Behavior
When APP_ENV=dev, permission checks are bypassed and a default user id is returned. This keeps local testing fast but should be disabled for production.

## Extension Ideas
- Swap hardcoded users for a database or SSO provider.
- Add JWT validation and per-tenant policies.
- Add fine-grained scopes for read/write and admin functions.

## Dependencies
- fastapi Request + HTTPException

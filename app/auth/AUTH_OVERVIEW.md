# Auth Module Overview (app/auth/)

Purpose
- Provide lightweight role-based access control for API routes.
- Keep local development friction low while still supporting permission checks.

What it does
- middleware.py: gate endpoints by required permission, with a dev-mode bypass.
- user_role_service.py: define roles, users, and permission sets.

Features that show design intent
- Environment-aware access: permissive in dev, enforced in prod.
- Simple policy map: roles are explicit and easy to audit.
- Header/query support: accepts user identity from headers or query params.

Libraries used
- fastapi (Request, HTTPException)

# ZeroPlay

ZeroPlay is a production-minded full-stack soccer intelligence app built to demonstrate modern frontend engineering, Express API design, Supabase authentication, database-backed personalization, and external sports-data integration.

The public repository is intentionally shaped as a portfolio project: it keeps the real application architecture visible while keeping secrets, internal notes, local archives, and implementation-sensitive planning out of version control.

## Highlights

- React + Vite single-page app with league, team, games, news, profile, settings, and protected account flows.
- Express API with route modules, middleware, shared response helpers, validation, and service-layer boundaries.
- Supabase Auth integration for signup, login, logout, session restore, account updates, and JWT-protected requests.
- User-scoped favorites backed by authenticated API calls and database access patterns designed for row-level security.
- Sports-data integration through public ESPN soccer endpoints plus a refresh script for generated league/team data.
- Security-minded backend defaults: rate limiting, bearer-token validation, environment-only secrets, admin sync token protection, and disabled-by-default diagnostics.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React, Vite, React Router, CSS |
| Backend | Node.js, Express, CommonJS modules |
| Auth and data | Supabase Auth, Supabase client, PostgreSQL/RLS-oriented access patterns |
| Integrations | ESPN public soccer APIs |
| Security | Express rate limiting, JWT verification, protected routes, env-based secret loading |

## Architecture

```text
frontend/src/pages + frontend/src/components
  -> frontend/src/context/AuthContext.jsx
  -> backend/server/routes
  -> backend/server/middleware/authenticate.js
  -> backend/server/services
  -> Supabase Auth / Supabase data / ESPN APIs
```

The repo keeps the important engineering surfaces public:

- `backend/server/routes/` for API entry points.
- `backend/server/middleware/` for authentication and error handling.
- `backend/server/services/` for Supabase, auth, favorites, teams, and external API logic.
- `frontend/src/components/` and `frontend/src/pages/` for the user-facing React app.
- `frontend/src/context/` for session persistence and authenticated frontend state.

Detailed production secrets, private notes, local archives, and internal roadmap material are intentionally excluded.

## Security Posture

- Real credentials are loaded from `.env` files only and are ignored by Git.
- Public `.env.example` files document required variables with placeholder values.
- Backend Supabase service-role credentials stay server-side only.
- Protected API routes require `Authorization: Bearer <accessToken>`.
- Auth middleware verifies Supabase JWTs before attaching user context.
- Favorites and account updates are scoped to the authenticated user.
- Manual team sync requires an admin token through `x-admin-token` or `Authorization: Bearer`.
- Supabase diagnostics are disabled by default and cannot be enabled in production mode.

## Local Setup

Install dependencies:

```bash
cd backend/server
npm install
cd ../../frontend
npm install
```

Create local environment files:

```bash
copy backend\server\.env.example backend\server\.env
copy frontend\.env.example frontend\.env
```

Start the backend:

```bash
cd backend/server
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Environment Variables

Backend variables are documented in `backend/server/.env.example`. The only frontend variable currently required is `VITE_API_BASE_URL`, documented in `frontend/.env.example`.

Do not expose backend Supabase service-role keys in frontend code or browser-visible `VITE_*` variables.

## Reviewer Notes

ZeroPlay is designed to be inspected as a full-stack portfolio project. The public code shows authentication flows, API boundaries, data-access patterns, background sync structure, and frontend state management without publishing real secrets or internal business planning.

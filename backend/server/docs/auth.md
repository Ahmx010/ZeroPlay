# ZeroPlay Auth And Favorites

This document summarizes the public auth contract for local development and code review. It intentionally focuses on request flow and ownership boundaries instead of publishing production schema details.

## Public Engineering Surface

- `middleware/authenticate.js` reads `Authorization: Bearer <token>`, verifies the Supabase Auth JWT, and attaches authenticated user context to the request.
- `routes/auth.js` exposes signup, login, logout, current-user lookup, and account update endpoints.
- `routes/favorites.js` exposes protected favorites endpoints.
- `services/authService.js` and `services/favoriteService.js` keep Supabase and data-access logic out of route handlers.
- `utils/responses.js` keeps JSON response shapes consistent across the API.

## Request Flow

1. The frontend calls `POST /auth/signup` or `POST /auth/login`.
2. Express delegates credential handling to Supabase Auth through `authService.js`.
3. Supabase Auth handles password hashing, session issuance, and email verification settings.
4. The frontend stores the returned access token according to the selected session mode.
5. Protected requests send `Authorization: Bearer <accessToken>`.
6. `middleware/authenticate.js` validates the JWT before protected services run.
7. Data operations are scoped to the authenticated user, with database policies expected to enforce the same ownership boundary.

## Favorites Ownership

Favorites are always resolved from the verified user context. The client never submits a user id for ownership decisions, and the service layer scopes reads/writes to the authenticated account.

## Local Request Examples

Set a local client variable named `baseUrl` to `http://localhost:5000`.
Set `accessToken` from a successful signup or login response.

### POST /auth/signup

Method: `POST`
URL: `{{baseUrl}}/auth/signup`
Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "email": "user@example.com",
  "password": "<password>",
  "username": "zero_user"
}
```

### POST /auth/login

Method: `POST`
URL: `{{baseUrl}}/auth/login`
Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "email": "user@example.com",
  "password": "<password>"
}
```

### POST /auth/logout

Method: `POST`
URL: `{{baseUrl}}/auth/logout`
Headers:

```http
Authorization: Bearer {{accessToken}}
```

### GET /auth/me

Method: `GET`
URL: `{{baseUrl}}/auth/me`
Headers:

```http
Authorization: Bearer {{accessToken}}
```

### PATCH /auth/me

Method: `PATCH`
URL: `{{baseUrl}}/auth/me`
Headers:

```http
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

Body:

```json
{
  "username": "zero_user",
  "email": "new-user@example.com",
  "password": "<new-password>",
  "currentPassword": "<current-password>"
}
```

Only send the account fields being changed. `currentPassword` is required when changing email or password.

### GET /favorites

Method: `GET`
URL: `{{baseUrl}}/favorites`
Headers:

```http
Authorization: Bearer {{accessToken}}
```

### POST /favorites

Method: `POST`
URL: `{{baseUrl}}/favorites`
Headers:

```http
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

Body:

```json
{
  "team_id": 1
}
```

### DELETE /favorites/:id

Method: `DELETE`
URL: `{{baseUrl}}/favorites/1`
Headers:

```http
Authorization: Bearer {{accessToken}}
```

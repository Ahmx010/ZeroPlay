# ZeroPlay Auth And Favorites

## New Files

- `database/auth_schema.sql`: Supabase SQL for `profiles`, `favorites`, profile creation trigger, indexes, foreign keys, grants, and row level security policies.
- `middleware/authenticate.js`: Express middleware that reads `Authorization: Bearer <token>`, verifies the token with Supabase Auth, attaches `req.user`, `req.accessToken`, and a user-scoped Supabase client to the request.
- `routes/auth.js`: Route handlers for signup, login, logout, and the protected current-user endpoint.
- `routes/favorites.js`: Protected favorites route handlers.
- `services/authService.js`: Supabase Auth business logic for signup, login, logout, and `GET /auth/me`.
- `services/favoriteService.js`: Favorites data access logic, always scoped to the authenticated user.
- `utils/responses.js`: Shared JSON response helpers for `{ "success": true, "data": ... }` and `{ "success": false, "message": "..." }`.

## Request Flow

1. Frontend signs up or logs in through `POST /auth/signup` or `POST /auth/login`.
2. Express calls Supabase Auth through `authService.js`.
3. Supabase Auth hashes passwords, stores auth users in `auth.users`, issues JWTs and refresh tokens, and handles email verification according to the Supabase project settings.
4. The frontend stores the returned access token and sends it on protected requests as `Authorization: Bearer <accessToken>`.
5. `middleware/authenticate.js` validates the JWT with Supabase Auth using `supabase.auth.getUser(token)`.
6. Protected services use `req.supabase`, a Supabase client carrying the user's JWT, so database RLS policies apply to the authenticated user.
7. Express returns consistent JSON responses.

## Favorites Ownership

`favorites.user_id` references `profiles.id`, which is the same UUID as `auth.users.id`. On every protected favorites request, Express uses `req.user.id` from the verified Supabase JWT. The route never accepts `user_id` from the client. The service filters and writes favorites with that authenticated user id, and Supabase RLS policies enforce the same ownership rule in the database.

## Thunder Client Requests

Set an environment variable named `baseUrl` to `http://localhost:5000`.
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
  "email": "alex@example.com",
  "password": "Password123!",
  "username": "alex_zero"
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
  "email": "alex@example.com",
  "password": "Password123!"
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
  "username": "alex_zero",
  "email": "alex@example.com",
  "password": "NewPassword123!",
  "currentPassword": "Password123!"
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

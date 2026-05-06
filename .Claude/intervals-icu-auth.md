# Intervals.icu API Authentication

Reference document for implementing authentication against the Intervals.icu API.
Source: official OpenAPI spec + [OAuth support forum thread](https://forum.intervals.icu/t/intervals-icu-oauth-support/2759).

---

## Base URL

```
https://intervals.icu
```

---

## Option 1: API Key (HTTP Basic Auth)

### When to use
Only appropriate for personal tools or single-user apps where the app owner is also the athlete. **Do not use this for multi-user third-party apps** — users should not share API keys with external applications.

### How it works
Intervals.icu uses a non-standard Basic Auth convention:
- **Username:** the literal string `API_KEY`
- **Password:** the user's personal API key

The user finds their API key at: `https://intervals.icu/settings` → **Developer Settings** (near the bottom of the page).

### Request format

Encode `API_KEY:<user_api_key>` in Base64 and pass as the Authorization header:

```http
GET /api/v1/athlete/{id}
Authorization: Basic QVBJX0tFWTo8dXNlcl9hcGlfa2V5Pg==
```

Or using curl:

```bash
curl -u API_KEY:<user_api_key> https://intervals.icu/api/v1/athlete/{id}
```

### Notes
- No token expiry — keys are long-lived until the user regenerates them
- Full account access — no scope restrictions
- Users can regenerate their key at any time from `/settings`, which will break your integration

---

## Option 2: OAuth 2.0 (Bearer Token)

### When to use
Required for any third-party app that accesses data on behalf of other athletes. This is the correct approach for multi-user applications.

---

### Step 1 — App Registration (one-time, manual)

App registration is **not self-serve**. Email `david@intervals.icu` with the following:

| Field | Notes |
|---|---|
| App name | Display name shown to users |
| Description | What your app does |
| Website URL | Your app's public URL |
| Logo image URL | Square image, minimum 128×128px |
| Privacy policy URL | Required |
| Redirect URI(s) | `http://localhost/` is allowed for local dev |
| Your Intervals.icu ID | Found at the bottom of your `/settings` page |

Once approved, David creates the app. You manage it via the **"Manage App"** button in your `/settings` page, where you can retrieve your `client_id` and `client_secret`, update redirect URIs, and configure webhooks.

---

### Step 2 — Authorization Request

Redirect the user to:

```
https://intervals.icu/oauth/authorize
  ?client_id=<your_client_id>
  &redirect_uri=<your_redirect_uri>
  &scope=<comma_separated_scopes>
  &state=<optional_csrf_token>
```

**Example:**
```
https://intervals.icu/oauth/authorize?client_id=my_app&redirect_uri=https%3A%2F%2Fmyapp.com%2Fcallback&scope=ACTIVITY:READ,WELLNESS:READ&state=xyz123
```

Intervals.icu will show the user a confirmation dialog listing the scopes your app is requesting, with Read/Update checkboxes per scope. The user can then authorize or decline.

**On approval**, the user is redirected to your `redirect_uri` with:
```
https://your-redirect-uri?code=<authorization_code>&state=<your_state>
```

**On decline**, the user is redirected with:
```
https://your-redirect-uri?error=access_denied
```

---

### Step 3 — Token Exchange

**You have 2 minutes** to exchange the authorization code for an access token.

```bash
curl -X POST https://intervals.icu/api/oauth/token \
  -d client_id=<your_client_id> \
  -d client_secret=<your_client_secret> \
  -d code=<authorization_code>
```

**Successful response:**
```json
{
  "token_type": "Bearer",
  "access_token": "d842c1fc25f241e5ae440d09756448a9",
  "scope": "ACTIVITY:WRITE,WELLNESS:WRITE",
  "athlete": {
    "id": "i30035",
    "name": "David (intervals.icu)"
  }
}
```

Note: The response also includes the athlete's `id` and `name` — store these alongside the token.

---

### Step 4 — Making API Calls

Pass the access token as a Bearer token on all requests:

```http
GET /api/v1/athlete/{id}/activities
Authorization: Bearer d842c1fc25f241e5ae440d09756448a9
```

**Athlete ID shortcut:** Use `"0"` as the `{id}` path parameter on any endpoint that accepts one — it automatically resolves to the athlete who owns the bearer token:

```bash
curl -H "Authorization: Bearer <access_token>" \
  https://intervals.icu/api/v1/athlete/0/activities
```

---

### Step 5 — Revoking Access

To disconnect/revoke an app's access token:

```http
DELETE /api/v1/disconnect-app
Authorization: Bearer <access_token>
```

Returns `200` on success, `401` if the token is missing or invalid.

---

### Scopes

Declare scopes during the authorization request. For each scope, specify `READ` or `WRITE` (WRITE implies READ). Combine multiple scopes with commas.

| Scope | Covers |
|---|---|
| `ACTIVITY` | Completed rides, runs, and other activities |
| `WELLNESS` | Weight, resting HR, sleep, etc. |
| `CALENDAR` | Planned workouts |
| `CHATS` | Groups and messages |
| `LIBRARY` | Workout library |
| `SETTINGS` | Athlete settings |

**Examples:**
```
ACTIVITY:READ
ACTIVITY:READ,WELLNESS:READ
ACTIVITY:WRITE,WELLNESS:WRITE
```

---

### Token Notes

- **No refresh token** is documented — tokens appear to be long-lived
- **No token expiry** is specified in the spec or forum thread
- If a token is lost, the user must re-authorize through the OAuth flow
- The `state` parameter is optional but recommended for CSRF protection

---

## Security Scheme Summary (from OpenAPI spec)

```yaml
securitySchemes:
  APIKey:
    type: http
    scheme: basic
    description: Username is API_KEY, Password is your API key found in /settings

  AccessToken:
    type: http
    scheme: bearer
    description: Use bearer token for an athlete from OAuth flow
```

Both schemes are applied globally across all API endpoints.

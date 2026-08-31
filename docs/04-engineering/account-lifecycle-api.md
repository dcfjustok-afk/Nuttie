# Account Lifecycle API

This contract covers server account export and deletion. It does not define
the encrypted local backup or restore envelope; those decisions remain blocked
by D-027, D-030, and D-035.

## Export

`GET /api/v1/account/export` requires a valid Bearer access token and returns:

```json
{
  "data": {
    "schemaVersion": "NUTTIE_ACCOUNT_EXPORT_V1",
    "exportedAt": "2026-08-31T12:00:00.000Z",
    "user": {},
    "records": []
  }
}
```

The response is JSON, uses `Cache-Control: no-store`, and has the fixed
attachment name `nuttie-account-export.json`. The user object contains only
public profile fields. Records preserve their server representation and
ordering, including deletion markers, but never expose internal session data.

The export boundary rejects or omits credentials and raw AI material. It must
not contain password hashes, access or refresh tokens, session token hashes,
API keys, authorization values, or raw AI request/response payloads.

## Deletion

`DELETE /api/v1/account` requires a valid Bearer access token and this exact
JSON body:

```json
{ "confirmation": "DELETE" }
```

Any other body is rejected with `VALIDATION_ERROR` before the delete operation
runs. A successful response is:

```json
{ "data": { "deleted": true } }
```

PostgreSQL deletes the user in one statement and relies on the schema's
`ON DELETE CASCADE` relationships to remove sessions, records, mutations, and
revision state. The in-memory repository mirrors this behavior for tests and
local previews. Every access and refresh session becomes invalid immediately
after the account row is removed.

The client clears its local session, cache, and queued mutations only after a
successful server response. Local encrypted backup/restore, media cleanup,
and native SQLCipher generation switching are separate capabilities and must
not be inferred from this API contract.

## Browser and native behavior

Browser requests use the same-origin `/api` gateway and an HttpOnly refresh
cookie. Native requests use the public Web origin, identify themselves with
`x-client-platform: native`, and keep the refresh token in platform secure
storage. Both clients use the same export and deletion routes and receive the
same privacy guarantees.

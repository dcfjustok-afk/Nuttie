# Zeabur deployment topology

Nuttie intentionally deploys three pieces only:

```text
browser or native client (HTTPS) -> web/Nginx (public)
                                     /api/* -> api (private)
                                                 -> PostgreSQL (private)
```

There is no Redis, LiveKit, WebSocket service, admin service, public API
domain, or production deployment workflow in this first cross-platform slice.
The repository push and a production release remain separate actions.

## Services

1. Create a managed PostgreSQL service in the Zeabur project. Keep it on the
   private network and use the connection string it provides.
2. Add an `api` service from this repository and select `Dockerfile.api`.
   Keep the service private. Set `ZBPACK_DOCKERFILE_NAME=api`,
   `NODE_ENV=production`,
   `ALLOW_IN_MEMORY=false`, `DATABASE_URL`, a random
   `ACCESS_TOKEN_SECRET` of at least 32 characters (for example, generate one
   with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`),
   and the public web origin in `ALLOWED_ORIGINS`. The API rejects placeholder
   secrets, wildcard origins, and origins with a path. Use `/ready` as the
   health check.
3. Add a `web` service from the same repository and select `Dockerfile.web`.
   Give only this service the public HTTPS domain. Set
   `ZBPACK_DOCKERFILE_NAME=web` and
   `API_UPSTREAM=http://api:8787` (replace `api` if the private service name
   differs). The Nginx config serves the Expo export and proxies `/api/` to the
   private API. Native builds must set `EXPO_PUBLIC_API_URL` to this same
   public web origin (the client appends `/api`); the app marks native requests with
   `x-client-platform: native`, so native sessions receive refresh tokens in
   the response body while browser sessions use the HttpOnly cookie.
4. Paste the matching files in `watch-paths/` into each service's Watch Paths
   setting. PostgreSQL is managed independently and has no Git watch path.

When the GitHub App cannot yet access a private repository, the same topology
can be bootstrapped from a checked-out workspace with the authenticated Zeabur
CLI. Use `zeabur deploy --create --project-id <project-id> --name api` and the
corresponding `web` command, then set the variables and private/public ports
described above. This upload path still builds the checked-in Dockerfiles on
Zeabur; connect the GitHub integration later to enable automatic redeploys.

The API entrypoint runs every checked-in SQL migration in one transaction and
uses a PostgreSQL advisory lock so concurrent releases do not race. It retries
temporary database unavailability. A missing `DATABASE_URL`, an empty
migration directory, or a failed final attempt exits before the API process is
started. Migration filenames are applied in deterministic lexical order and
recorded in `schema_migrations`; add new migrations with a stable numeric
prefix and never edit a file that has already been applied. Retry settings are
validated at startup; `MIGRATION_ATTEMPTS` must be at least `1` and
`MIGRATION_RETRY_DELAY_SECONDS` must be a non-negative integer.

## Local stack (optional)

The local Compose stack is a convenience for developers who have Docker
Desktop or another Compose-compatible engine. Docker is not a prerequisite for
publishing Nuttie: CI and Zeabur build the checked-in Dockerfiles remotely.
When the Docker CLI is unavailable on a workstation, continue with the
repository checks and the remote deployment path below; do not report the
missing local engine as a release blocker.

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

The web app is then available at `http://localhost:4187/`, the API at
`http://localhost:8787/`, and PostgreSQL is exposed on `127.0.0.1:5432` for
local tools. The compose stack keeps PostgreSQL on an internal data network;
the API bridges the data and edge networks, while the web container only sees
the API on the edge network.
Override `WEB_PORT`, `API_PORT`, or the PostgreSQL variables when those ports
are already in use; set `ENABLE_HSTS=true` only when serving the local stack
behind HTTPS. The compose file is not a production deployment manifest.

## CI boundary

`.github/workflows/ci.yml` installs with the frozen pnpm lockfile, runs
typechecks/tests/builds, and performs real Docker builds for both images on the
GitHub-hosted runner. It does not push images or call a deployment API. A
Zeabur GitHub integration can build the same Dockerfiles and deploy a reviewed
commit after the CI checks pass. The local Docker CLI is therefore optional
development tooling, not a release prerequisite.

## Production smoke

`.github/workflows/production-smoke.yml` performs read-only checks after a
successful Zeabur production deployment and can also be started manually. Set
the repository variable `NUTTIE_WEB_URL` to the public HTTPS origin once the
Web service has a stable domain. A manual run requires the same origin as its
`web_url` input. The smoke job verifies the Web health endpoint, the same-origin
`/api/v1/ready` proxy, the `/sign-in` static entrypoint, and the security headers
that protect the public gateway. It never registers an account, writes a
record, changes a setting, or calls a deployment API.

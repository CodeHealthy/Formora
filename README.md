# Formora

Formora is a multi-tenant SaaS platform for building forms, publishing immutable
form versions, collecting submissions, and analyzing responses. The application
starts as a modular monolith in a strict TypeScript npm workspace.

## Requirements

- Node.js 24 LTS
- npm 11 or later
- MongoDB 8 locally, through Atlas, or through Docker

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` at the repository root and adjust values when
   necessary. The API resolves this root file explicitly, including when it is
   started through an npm workspace command.

3. Ensure `MONGODB_URI` points to MongoDB Atlas or another MongoDB replica set,
   and set `MONGODB_DB_NAME` to the database Formora should use. Docker is
   optional; to use the repository's local replica set:

   ```sh
   docker compose up mongodb mongo-init -d --wait
   ```

4. Start the API and web development servers:

   ```sh
   npm run dev
   ```

The web application runs at `http://localhost:5173`. The API runs at
`http://localhost:3000`.

## Root commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API and web development servers together |
| `npm run lint` | Lint every workspace |
| `npm run typecheck` | Typecheck the project-reference graph |
| `npm run test` | Run all workspace test suites |
| `npm run build` | Build TypeScript packages, the API, and the web application |

Mongo integration tests deliberately force all operations into the disposable
`formora-integration-test` database and drop it afterward, regardless of the
database named in the supplied cluster URI:

```powershell
$env:MONGODB_TEST_URI="mongodb://localhost:27017/formora-test?replicaSet=rs0&directConnection=true"
npm run test:integration -w @formora/api
```

## Health endpoints

- `GET /health/live` confirms that the API process is running.
- `GET /health/ready` confirms that MongoDB is connected.

Both endpoints return the request correlation ID in the response body and the
`X-Request-Id` header. Their OpenAPI definition is in
`docs/api/openapi.yaml`.

## Repository structure

```text
apps/
  api/                 Express API and composition root
  web/                 React and Vite browser application
packages/
  contracts/           Shared transport schemas and DTOs
  form-engine/         Framework-independent form behavior
  eslint-config/       Shared lint rules
  typescript-config/   Shared strict TypeScript settings
docs/api/              OpenAPI documentation
infrastructure/        Deployment configuration
```

Package imports must follow their public exports. Domain and application code
must not import Express, React, Mongoose, or other infrastructure details.

## Containers

Run the complete local stack with:

```sh
docker compose up --build
```

The containerized web application is available at `http://localhost:8080` and
the API at `http://localhost:3000`.

## Current scope

This repository contains the Phase 0 foundation and Phase 1 authentication and
workspace membership slice. Forms, submissions, and analytics are intentionally
not implemented yet. The architecture and phased implementation plan are
documented in `FORMORAPLAN.md`.

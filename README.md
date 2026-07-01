# Hillpointe

A small Express API written in TypeScript with a version endpoint and PostgreSQL database integration.

## Requirements

- Node.js 20+
- npm
- Docker & Docker Compose (optional, for containerized deployment)

## Quick Start

### Local Development (In-Memory Store)

```bash
npm install
cp .env.example .env
npm run dev
```

This runs backend and frontend together.

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

### Docker Deployment (with PostgreSQL)

```bash
docker-compose up --build
```

This runs the full stack with persistent PostgreSQL database.

- Frontend: `http://localhost`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

For more Docker setup details, see [DOCKER.md](DOCKER.md).

### Development with Docker Database Only

```bash
# Start only PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Set database URL
export DATABASE_URL=postgresql://hillpointe_user:hillpointe_password@localhost:5432/hillpointe_db

# Run dev server
npm run dev
```

See [db/README.md](db/README.md) for database documentation.

## Frontend (React + Vite + Tailwind)

A frontend app is available in the `apps/web` folder and managed from the root scripts.

The Vite dev server runs at `http://localhost:5173` and proxies `/version` to the backend on port `3000`.

## Scripts

- `npm run dev` - Run backend and frontend together
- `npm run backend:dev` - Run backend only in watch mode (`apps/api/src`)
- `npm run build` - Build backend and frontend together
- `npm run backend:build` - Compile backend TypeScript to `apps/api/dist`
- `npm run frontend:build` - Build the Vite frontend
- `npm run prod` - Build both and serve frontend + API from one backend process
- `npm run start` - Run compiled server
- `npm run frontend:preview` - Preview the frontend build
- `npm run typecheck` - Type-check without emitting files
- `npm run test` - Run Jest once
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:coverage` - Run tests with coverage output
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run format` - Format with Prettier

## Database

The project includes PostgreSQL integration via Docker Compose. The database schema is automatically initialized with tables for:
- Units (property units)
- Prospects (customer records)
- Tours (scheduled tours)
- Tasks (prospect tasks)
- Activity Events (event log)

To migrate the API from in-memory store to PostgreSQL, see [db/MIGRATION.md](db/MIGRATION.md).

## API

- `GET /version`

### `GET /version`

Returns the package name and version.

```json
{
  "success": true,
  "version": "1.0.0",
  "name": "Hillpointe"
}
```

## Error Handling

Common error responses use this shape:

```json
{
  "success": false,
  "error": "Message"
}
```

## Project Notes

- Express is configured with `helmet`, `cors`, `express.json()`, and `morgan("dev")`
- Unknown routes return `404` with `{ "error": "Not Found" }`
- Backend code lives under `apps/api/src`
- Frontend code lives under `apps/web`
- Tests live under `apps/api/src/tests`

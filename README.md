# Hillpointe

A small Express API written in TypeScript with a version endpoint.

## Requirements

- Node.js 20+
- npm

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

This runs backend and frontend together.

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Set `PORT` in `.env` if you want a different backend port.

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

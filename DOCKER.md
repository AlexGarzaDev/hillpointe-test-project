# Docker Setup

This project is configured to run with Docker and Docker Compose, including PostgreSQL for data persistence.

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start all services (API, Web, PostgreSQL)
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost
# - API: http://localhost:3000
# - PostgreSQL: localhost:5432
```

### Option 2: Production Build Only

```bash
# Build individual images
docker build -f Dockerfile.api -t hillpointe-api .
docker build -f Dockerfile.web -t hillpointe-web .

# Run services
docker run -p 3000:3000 -e DATABASE_URL=postgresql://user:password@host:5432/db hillpointe-api
docker run -p 80:80 hillpointe-web
```

## Services

### PostgreSQL Database
- **Port**: 5432
- **User**: hillpointe_user
- **Password**: hillpointe_password
- **Database**: hillpointe_db
- **Data Volume**: `postgres_data` (persists across container restarts)

Schema includes tables for units, prospects, tours, tasks, and activity events.

### API (Node.js + Express)
- **Port**: 3000
- **Database**: Connected via `DATABASE_URL` environment variable
- **Health Check**: `/version` endpoint

### Web (React + Nginx)
- **Port**: 80
- **Frontend Build**: Vite
- **Server**: Nginx with SPA routing

## Development Workflow

### Using Docker for Database Only

For local development with hot-reload:

```bash
# Start only PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Set DATABASE_URL
export DATABASE_URL=postgresql://hillpointe_user:hillpointe_password@localhost:5432/hillpointe_db

# Run dev server locally
npm run dev
```

### Using Full Docker Stack

```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Database Management

### Connect to PostgreSQL

```bash
# From Docker container
docker-compose exec postgres psql -U hillpointe_user -d hillpointe_db

# From host machine
psql -h localhost -U hillpointe_user -d hillpointe_db
```

### Backup and Restore

```bash
# Backup
docker-compose exec postgres pg_dump -U hillpointe_user hillpointe_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U hillpointe_user hillpointe_db < backup.sql
```

### View Logs

```bash
docker-compose logs postgres
```

## Environment Variables

Create a `.env` file for local overrides:

```env
# Database (for docker-compose only)
DATABASE_URL=postgresql://hillpointe_user:hillpointe_password@postgres:5432/hillpointe_db

# API
NODE_ENV=production
PORT=3000

# Web
VITE_API_URL=http://api:3000
```

## Project Structure

- **Dockerfile.api** - Multi-stage build for Node.js API (Express + TypeScript)
- **Dockerfile.web** - Multi-stage build for React frontend (Vite + Nginx)
- **docker-compose.yml** - Production configuration with PostgreSQL
- **docker-compose.dev.yml** - Development configuration (PostgreSQL only)
- **nginx.conf** - Nginx configuration for SPA routing
- **.dockerignore** - Files excluded from Docker build
- **db/init.sql** - Database schema and seed data
- **db/README.md** - Database documentation

## Troubleshooting

### Database Connection Error

If the API fails to connect to the database:

1. Ensure PostgreSQL is running: `docker-compose ps`
2. Check the `DATABASE_URL` environment variable
3. Verify the database is healthy: `docker-compose exec postgres pg_isready`

### Port Already in Use

```bash
# Change port mappings in docker-compose.yml
# or kill the process using the port

# On macOS/Linux
lsof -i :3000
kill -9 <PID>

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Rebuild Without Cache

```bash
docker-compose build --no-cache
docker-compose up
```

## Cleanup

```bash
# Stop containers
docker-compose down

# Remove images
docker rmi hillpointe-api hillpointe-web

# Remove all data (including database)
docker-compose down -v
```

# Running Hillpointe with Sequelize

## Prerequisites

- Node.js 20+
- PostgreSQL (via Docker or locally installed)
- npm

## Quick Start - Docker Compose

### Full Stack (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Services:
# - Frontend: http://localhost
# - API: http://localhost:3000
# - PostgreSQL: localhost:5432
```

### PostgreSQL Only (for local development)

```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=hillpointe_user
export DB_PASSWORD=hillpointe_password
export DB_NAME=hillpointe_db
export NODE_ENV=development

# Run development server
npm run dev
```

## Environment Setup

### Create .env file

```bash
cp .env.example .env
```

Update with your database details:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=hillpointe_user
DB_PASSWORD=hillpointe_password
DB_NAME=hillpointe_db

# Web Frontend
VITE_API_URL=http://localhost:3000
```

## Development Workflow

### Option 1: Everything in Docker

```bash
docker-compose up --build
```

The API will automatically:
1. Connect to PostgreSQL
2. Sync Sequelize models
3. Create tables and relationships
4. Serve API on port 3000

### Option 2: Local Development with Docker DB

```bash
# Start database
docker-compose -f docker-compose.dev.yml up -d

# Install and run
npm install
npm run backend:dev

# Frontend (in another terminal)
npm run frontend:dev
```

Access:
- Frontend: http://localhost:5173
- API: http://localhost:3000

### Option 3: All Local (manual PostgreSQL)

Ensure PostgreSQL is running locally, then:

```bash
npm install
npm run dev
```

## Database Initialization

On first run, Sequelize automatically:
1. Connects to PostgreSQL
2. Checks for tables
3. Creates missing tables from models
4. In development, alters schema if models changed

In production, you should use migrations instead:

```bash
npm run backend:build
npm run start
```

## Common Commands

```bash
# Development with auto-reload
npm run backend:dev

# Build for production
npm run backend:build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test
npm run test:watch

# Full stack dev
npm run dev
```

## Database Connection Troubleshooting

### Check PostgreSQL is running

```bash
# Docker
docker-compose ps

# Or locally
psql -h localhost -U hillpointe_user -d hillpointe_db -c "SELECT 1;"
```

### Verify environment variables

```bash
# Check Docker Compose settings
docker-compose config | grep DB_

# Check .env
cat .env
```

### View API logs

```bash
# Docker
docker-compose logs -f api

# Local
npm run backend:dev
```

### Reset database (development only)

```bash
# Stop and remove containers
docker-compose down -v

# Restart
docker-compose up --build
```

## Database Schema

Sequelize creates these tables automatically:
- `units` - Property units
- `prospects` - Customers
- `tours` - Scheduled tours
- `tasks` - Prospect tasks
- `activity_events` - Activity log

All tables include:
- UUID primary keys
- Timestamp tracking
- Foreign key relationships
- Cascading delete behavior

## API Endpoints

All endpoints are async (awaiting database operations):

**Units**
- `GET /units` - List all units
- `GET /units/:id` - Get single unit
- `POST /units` - Create unit
- `PATCH /units/:id` - Update unit

**Prospects**
- `GET /prospects` - List all prospects
- `GET /prospects/:id` - Get single prospect
- `POST /prospects` - Create prospect
- `PATCH /prospects/:id` - Update prospect
- `POST /prospects/:id/transition` - Change prospect status

**Tours**
- `GET /tours` - List all tours
- `GET /tours/:id` - Get single tour
- `POST /tours` - Create tour
- `PATCH /tours/:id` - Update tour outcome

**Tasks**
- `GET /tasks` - List tasks (optionally filter by prospectId)
- `GET /tasks/:id` - Get single task
- `PATCH /tasks/:id` - Update task state

**Activity**
- `GET /activity` - List activity (optionally filter by prospectId)

**Version**
- `GET /version` - Get API version

## Performance Notes

- Sequelize uses connection pooling (max 20, min 5)
- SQL queries are logged in development mode
- Models include created/updated timestamps for auditing
- Foreign key relationships use CASCADE delete for referential integrity

## Production Deployment

When deploying:

1. Set `NODE_ENV=production`
2. Use migrations instead of auto-sync
3. Add database backups
4. Configure connection pool appropriately
5. Use environment secrets for DB credentials
6. Enable query logging for debugging

See [SEQUELIZE.md](SEQUELIZE.md) for detailed ORM documentation.

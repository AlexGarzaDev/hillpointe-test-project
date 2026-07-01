# PostgreSQL Database Setup

The project now includes PostgreSQL for data persistence.

## Connection Details

When using Docker Compose:
- **Host**: postgres (internal network) or localhost (from host machine)
- **Port**: 5432
- **Username**: hillpointe_user
- **Password**: hillpointe_password
- **Database**: hillpointe_db
- **Connection URL**: postgresql://hillpointe_user:hillpointe_password@postgres:5432/hillpointe_db

## Database Schema

The `db/init.sql` script creates the following tables:
- **units** - Property units with status tracking
- **prospects** - Prospect/customer records
- **tours** - Scheduled tours with outcomes
- **tasks** - Prospect-related tasks (open/done)
- **activity_events** - Event log for prospect interactions

All tables include:
- UUID primary keys
- Timestamps (created_at, updated_at)
- Referential integrity with foreign keys
- Appropriate indexes for query performance

## Using the Database

### With Docker Compose

```bash
docker-compose up --build
```

PostgreSQL will automatically initialize with the schema.

### Connecting from Your App

The API container receives the `DATABASE_URL` environment variable:
```
postgresql://hillpointe_user:hillpointe_password@postgres:5432/hillpointe_db
```

### Manual Connection (for development)

```bash
# Using psql
psql -h localhost -U hillpointe_user -d hillpointe_db -W

# Connection string
postgresql://hillpointe_user:hillpointe_password@localhost:5432/hillpointe_db
```

## Persistence

Database data is stored in a Docker volume (`postgres_data`) and persists across container restarts.

## Backup and Restore

```bash
# Backup the database
docker-compose exec postgres pg_dump -U hillpointe_user hillpointe_db > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U hillpointe_user hillpointe_db < backup.sql
```

## Adding Database Driver to API

To connect the API to PostgreSQL, add the `pg` package to `apps/api/package.json`:

```json
"dependencies": {
  "pg": "^8.11.0"
}
```

Then update the API to use the database connection instead of the in-memory store in `apps/api/src/database/store.ts`.

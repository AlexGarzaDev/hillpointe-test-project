# Migration Guide: In-Memory Store to PostgreSQL

This guide explains how to migrate the API from using an in-memory store to using PostgreSQL.

## Current State

The API currently uses an in-memory `Store` class (`apps/api/src/database/store.ts`) that stores all data in JavaScript Maps. This is sufficient for development but doesn't persist data across restarts.

## Step 1: Add Database Driver

The `pg` package has already been added to `apps/api/package.json`. Install dependencies:

```bash
npm --prefix apps/api install
```

## Step 2: Create Database Connection Module

Create `apps/api/src/database/connection.ts`:

```typescript
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;
```

## Step 3: Update Store to Use PostgreSQL

Replace the in-memory implementations in `apps/api/src/database/store.ts` with database queries:

### Example: Migrate listUnits()

**Before (In-Memory):**
```typescript
listUnits(): Unit[] {
  return [...this.units.values()];
}
```

**After (PostgreSQL):**
```typescript
async listUnits(): Promise<Unit[]> {
  const result = await query('SELECT * FROM units ORDER BY created_at DESC');
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    status: row.status,
  }));
}
```

### Example: Migrate createUnit()

**Before:**
```typescript
createUnit(data: Omit<Unit, "id">): Unit {
  const unit: Unit = { id: randomUUID(), ...data };
  this.units.set(unit.id, unit);
  return unit;
}
```

**After:**
```typescript
async createUnit(data: Omit<Unit, "id">): Promise<Unit> {
  const result = await query(
    'INSERT INTO units (name, status) VALUES ($1, $2) RETURNING *',
    [data.name, data.status]
  );
  return result.rows[0];
}
```

## Step 4: Update Endpoints to Handle Async

All endpoint handlers need to handle async database calls:

**Before:**
```typescript
prospectsRouter.get("/", (_req: Request, res: Response) => {
  return sendResponse(res, 200, { success: true, data: store.listProspects() });
});
```

**After:**
```typescript
prospectsRouter.get("/", async (_req: Request, res: Response) => {
  const prospects = await store.listProspects();
  return sendResponse(res, 200, { success: true, data: prospects });
});
```

## Step 5: Environment Setup

Ensure `DATABASE_URL` is set:

```bash
export DATABASE_URL=postgresql://hillpointe_user:hillpointe_password@localhost:5432/hillpointe_db
```

## Step 6: Run Database Initialization

The database schema is automatically created when using Docker Compose. For local development:

```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Initialize schema (if not already done)
psql -h localhost -U hillpointe_user -d hillpointe_db -f db/init.sql
```

## Step 7: Testing

Update tests to mock database queries or use a test database:

```typescript
jest.mock('../database/connection', () => ({
  query: jest.fn(),
}));
```

## Migration Checklist

- [ ] Add `pg` package (already done)
- [ ] Create `apps/api/src/database/connection.ts`
- [ ] Update `Store` class methods to use `query()`
- [ ] Make all endpoint handlers async
- [ ] Update error handling
- [ ] Test all endpoints
- [ ] Update test suite
- [ ] Verify DATABASE_URL environment variable

## Rollback

To revert to in-memory store, simply comment out the database queries and restore the Map-based implementations.

## Performance Considerations

- Add indexes (already included in `db/init.sql`)
- Use connection pooling (configured in connection.ts)
- Cache frequently accessed data if needed
- Consider query optimization for large datasets

## Resources

- [Node.js pg package documentation](https://node-postgres.com/)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Best practices for connection pooling](https://wiki.postgresql.org/wiki/Number_Of_Database_Connections)

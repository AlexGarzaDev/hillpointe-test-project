# Sequelize ORM Implementation

This project now uses Sequelize, a powerful ORM for Node.js, to manage database operations.

## Project Structure

### Models
Located in `apps/api/src/database/models/`:
- **Unit.ts** - Property units with status tracking
- **Prospect.ts** - Customer/prospect records with unit association
- **Tour.ts** - Scheduled tours with outcomes
- **Task.ts** - Prospect-related tasks (open/done)
- **ActivityEvent.ts** - Event log for prospect interactions

### Configuration
- **sequelize.ts** - Sequelize instance initialization and database connection
- **store.ts** - Store class using Sequelize models with DTO conversion

## Key Features

### Type Safety
- Models use TypeScript generics for full type inference
- DTO (Data Transfer Object) conversion methods ensure consistent API responses

### Relationships
Models define associations:
- `Unit` → `Prospect` (1:N)
- `Prospect` → `Tour` (1:N)
- `Prospect` → `Task` (1:N)
- `Prospect` → `ActivityEvent` (1:N)

Example querying with relations:
```typescript
const prospect = await Prospect.findByPk(id, {
  include: [
    { association: 'unit', model: Unit },
    { association: 'tasks', model: Task },
    { association: 'tours', model: Tour },
  ],
});
```

### Automatic Timestamps
All models include `createdAt` and `updatedAt` timestamps for audit trails.

### Validation & Constraints
- UUID primary keys with auto-generation
- Foreign key constraints with cascading deletes
- ENUM type constraints (e.g., unit status, prospect status)
- Email uniqueness on prospects

## Environment Configuration

Sequelize uses individual environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=hillpointe_user
DB_PASSWORD=hillpointe_password
DB_NAME=hillpointe_db
NODE_ENV=development
```

In production, set `NODE_ENV=production` to disable SQL logging.

## Database Initialization

The `initializeDatabase()` function in `sequelize.ts`:
1. Authenticates the connection
2. Syncs all models with the database
3. In development, uses `alter: true` to update schema changes
4. In production, requires migrations for schema changes

## Migration Pattern

For production schema changes, create a migration:

```bash
# Using Sequelize CLI (if installed)
npx sequelize migration:create --name add-column-to-table
```

Then run migrations:
```bash
npx sequelize db:migrate
```

## Querying Examples

### Find all with ordering
```typescript
await Unit.findAll({
  order: [['createdAt', 'DESC']],
  limit: 10,
});
```

### Find with where clause
```typescript
await Task.findAll({
  where: { prospectId: id, state: 'open' },
});
```

### Find one
```typescript
await Prospect.findByPk(id);
```

### Create
```typescript
await Unit.create({
  name: 'Unit 101',
  status: 'available',
});
```

### Update
```typescript
const unit = await Unit.findByPk(id);
await unit.update({ status: 'leased' });
```

### Delete
```typescript
await Unit.destroy({ where: { id } });
```

## Benefits Over Raw SQL

1. **Type Safety** - Full TypeScript support with no SQL strings
2. **Validation** - Built-in data type and constraint validation
3. **Relationships** - Automatic JOIN handling
4. **Transactions** - Easy transaction management
5. **Query Optimization** - Automatic connection pooling
6. **Migration Support** - Schema version control
7. **Consistency** - DTOs ensure consistent API responses

## Adding New Models

1. Create model file in `apps/api/src/database/models/YourModel.ts`:

```typescript
import { DataTypes, Model } from 'sequelize';
import sequelize from '../sequelize';

export class YourModel extends Model {}

YourModel.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'YourModel',
  tableName: 'your_models',
  timestamps: true,
});

export default YourModel;
```

2. Export from `apps/api/src/database/models/index.ts`
3. Add store methods in `store.ts`
4. Use in endpoints

## Troubleshooting

### Connection issues
- Verify `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Check PostgreSQL is running and accessible
- Review Sequelize logs in development mode

### Sync issues
- In development, Sequelize auto-syncs with `alter: true`
- In production, use migrations instead
- If schema is out of sync, manually alter tables or use migrations

### Performance
- Add indexes on frequently queried columns
- Use `limit` and `offset` for pagination
- Eager load related data with `include` to avoid N+1 queries

## Resources

- [Sequelize Documentation](https://sequelize.org/)
- [DataTypes Reference](https://sequelize.org/docs/v6/other-topics/other-data-types/)
- [Model Querying](https://sequelize.org/docs/v6/core-concepts/model-querying-finders/)
- [Associations](https://sequelize.org/docs/v6/core-concepts/assocs/)

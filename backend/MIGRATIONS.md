# TypeORM Migrations Guide

This project uses TypeORM for database migrations. Below are the available scripts and how to use them.

## Available Scripts

### Migration Management
- `npm run migration:generate -- src/database/migrations/MigrationName` - Generate a new migration based on entity changes
- `npm run migration:create -- src/database/migrations/MigrationName` - Create an empty migration file
- `npm run migration:run` - Run all pending migrations
- `npm run migration:revert` - Revert the last migration
- `npm run migration:show` - Show all migrations and their status

### Schema Management
- `npm run schema:sync` - Synchronize database schema with entities (development only)
- `npm run schema:drop` - Drop all tables (⚠️ destructive, use with caution)

## Usage Examples

### Generate a Migration
```bash
# Generate migration based on entity changes
npm run migration:generate -- src/database/migrations/AddUserTable

# This will create a file like: 1700000000000-AddUserTable.ts
```

### Create an Empty Migration
```bash
# Create an empty migration file
npm run migration:create -- src/database/migrations/CustomMigration
```

### Run Migrations
```bash
# Run all pending migrations
npm run migration:run

# Check migration status
npm run migration:show
```

### Revert Migrations
```bash
# Revert the last migration
npm run migration:revert
```

## Migration File Structure

Each migration file should:
1. Implement `MigrationInterface`
2. Have a unique timestamp prefix
3. Include both `up()` and `down()` methods
4. Use the `QueryRunner` for database operations

Example:
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1700000000000 implements MigrationInterface {
  name = 'MigrationName1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration logic here
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic here
  }
}
```

## Best Practices

1. **Always test migrations** on a development database first
2. **Keep migrations small and focused** - one change per migration
3. **Use descriptive names** for migration files
4. **Test rollbacks** to ensure they work correctly
5. **Never modify existing migrations** that have been committed to version control
6. **Use transactions** for complex migrations when possible

## Configuration

Migrations are configured in `ormconfig.ts`:
- Migrations directory: `src/database/migrations/*{.ts,.js}`
- Synchronize is disabled for production safety
- Logging is enabled in development mode

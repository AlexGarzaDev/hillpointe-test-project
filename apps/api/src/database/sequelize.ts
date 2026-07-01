import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
const maxConnectAttempts = Number.parseInt(process.env.DB_CONNECT_RETRIES || '8', 10);
const retryDelayMs = Number.parseInt(process.env.DB_CONNECT_RETRY_DELAY_MS || '2500', 10);
const isProduction = process.env.NODE_ENV === 'production';
const resolvedHost = process.env.DB_HOST || process.env.PGHOST || (isProduction ? undefined : 'localhost');
const resolvedPort = process.env.DB_PORT || process.env.PGPORT || '5432';
const resolvedUser = process.env.DB_USER || process.env.PGUSER || (isProduction ? undefined : 'hillpointe_user');
const resolvedPassword =
  process.env.DB_PASSWORD || process.env.PGPASSWORD || (isProduction ? undefined : 'hillpointe_password');
const resolvedDatabase = process.env.DB_NAME || process.env.PGDATABASE || (isProduction ? undefined : 'hillpointe_db');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getConnectionTarget(): { mode: 'DATABASE_URL' | 'DB_VARS'; host?: string; port?: string } {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      return {
        mode: 'DATABASE_URL',
        host: parsed.hostname,
        port: parsed.port || '5432',
      };
    } catch {
      return { mode: 'DATABASE_URL' };
    }
  }

  return {
    mode: 'DB_VARS',
    host: resolvedHost,
    port: resolvedPort,
  };
}

const commonOptions = {
  dialect: 'postgres' as const,
  define: {
    underscored: true,
  },
  logging: process.env.NODE_ENV === 'development' ? (sql: string) => logger.debug(sql) : false,
  pool: {
    max: 20,
    min: 5,
    idle: 30000,
    acquire: 60000,
  },
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : undefined,
};

// Prefer DATABASE_URL when available (common in managed hosts like Render).
// Fall back to individual DB_* vars for local/docker development.
if (!process.env.DATABASE_URL && isProduction) {
  const missingVars: string[] = [];
  if (!resolvedHost) missingVars.push('DB_HOST/PGHOST');
  if (!resolvedUser) missingVars.push('DB_USER/PGUSER');
  if (!resolvedPassword) missingVars.push('DB_PASSWORD/PGPASSWORD');
  if (!resolvedDatabase) missingVars.push('DB_NAME/PGDATABASE');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing production database configuration. Set DATABASE_URL or ${missingVars.join(', ')}`,
    );
  }
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize({
      ...commonOptions,
      host: resolvedHost,
      port: Number.parseInt(resolvedPort, 10),
      username: resolvedUser,
      password: resolvedPassword,
      database: resolvedDatabase,
    });

export async function initializeDatabase(): Promise<void> {
  const target = getConnectionTarget();

  for (let attempt = 1; attempt <= maxConnectAttempts; attempt += 1) {
    try {
      logger.info('Attempting database connection', {
        attempt,
        maxConnectAttempts,
        mode: target.mode,
        host: target.host,
        port: target.port,
        ssl: useSsl,
      });

      // Connectivity check fails fast for invalid credentials/network before sync.
      await sequelize.authenticate();
      logger.info('Database connection established successfully');

      // In non-production environments, allow schema alignment from model metadata.
      // Production should use explicit migrations for safe, controlled evolution.
      await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
      logger.info('Database models synchronized');
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxConnectAttempts;
      logger.error('Database initialization attempt failed', {
        attempt,
        maxConnectAttempts,
        mode: target.mode,
        host: target.host,
        port: target.port,
        error,
      });

      if (isLastAttempt) {
        logger.error('Failed to initialize database', { error });
        throw error;
      }

      await sleep(retryDelayMs);
    }
  }
}

export default sequelize;

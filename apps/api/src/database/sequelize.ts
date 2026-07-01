import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
const maxConnectAttempts = Number.parseInt(process.env.DB_CONNECT_RETRIES || '8', 10);
const retryDelayMs = Number.parseInt(process.env.DB_CONNECT_RETRY_DELAY_MS || '2500', 10);

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
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
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
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize({
      ...commonOptions,
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'hillpointe_user',
      password: process.env.DB_PASSWORD || 'hillpointe_password',
      database: process.env.DB_NAME || 'hillpointe_db',
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

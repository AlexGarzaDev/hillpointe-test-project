import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'hillpointe_user',
  password: process.env.DB_PASSWORD || 'hillpointe_password',
  database: process.env.DB_NAME || 'hillpointe_db',
  logging: process.env.NODE_ENV === 'development' ? (sql) => logger.debug(sql) : false,
  pool: {
    max: 20,
    min: 5,
    idle: 30000,
    acquire: 60000,
  },
});

export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync all models with the database (use alterTable for migrations in production)
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    logger.info('Database models synchronized');
  } catch (error) {
    logger.error('Failed to initialize database', { error });
    throw error;
  }
}

export default sequelize;

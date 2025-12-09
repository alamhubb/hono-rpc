/**
 * Drizzle ORM 数据库配置
 */
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql, { Pool } from 'mysql2/promise';

// 数据库连接配置
const dbConfig = {
  host: 'bj-cynosdbmysql-grp-kfc8rvj0.sql.tencentcdb.com',
  port: 22542,
  user: 'db_dev',
  password: 'dbdev@12',
  database: 'socialuni_dd',
  charset: 'utf8',
  ssl: false
};

// 创建连接池
let pool: Pool | null = null;
let db: MySql2Database | null = null;

/**
 * 获取数据库连接
 */
export async function getDb(): Promise<MySql2Database> {
  if (!db) {
    pool = mysql.createPool(dbConfig);
    db = drizzle(pool);
    console.log('[DB] 数据库连接已创建');
  }
  return db;
}

/**
 * 获取连接池（用于原生查询）
 */
export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('[DB] 连接池已创建');
  }
  return pool;
}

/**
 * 关闭数据库连接
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log('[DB] 数据库连接已关闭');
  }
}

export { dbConfig };


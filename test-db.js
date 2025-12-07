/**
 * 测试数据库连接并查看表结构
 */
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'bj-cynosdbmysql-grp-kfc8rvj0.sql.tencentcdb.com',
  port: 22542,
  user: 'db_dev',
  password: 'dbdev@12',
  database: 'socialuni_dd',
  charset: 'utf8',
  ssl: false
};

async function main() {
  try {
    console.log('连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('连接成功！');
    
    // 查看表结构
    console.log('\n--- s_user 表结构 ---');
    const [columns] = await connection.execute('DESCRIBE s_user');
    console.table(columns);
    
    // 查询前10条数据
    console.log('\n--- s_user 前10条数据 ---');
    const [rows] = await connection.execute('SELECT * FROM s_user LIMIT 10');
    console.table(rows);
    
    await connection.end();
    console.log('\n连接已关闭');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

main();


/**
 * 数据库查询函数
 */
import { getDb } from './index.js';
import { sUser } from './schema.js';

/**
 * 获取用户数据（支持分页）
 * @param {number} limit - 限制条数，默认 10
 * @param {number} offset - 偏移量，默认 0
 */
export async function getUsers(limit = 10, offset = 0) {
  const db = await getDb();

  const users = await db
    .select({
      id: sUser.id,
      nickname: sUser.nickname,
      avatar: sUser.avatar,
      age: sUser.age,
      gender: sUser.gender,
      city: sUser.city,
      status: sUser.status,
      createTime: sUser.createTime,
    })
    .from(sUser)
    .limit(limit)
    .offset(offset);

  console.log(`[DB] 查询用户: offset=${offset}, limit=${limit}, 返回 ${users.length} 条`);
  return users;
}


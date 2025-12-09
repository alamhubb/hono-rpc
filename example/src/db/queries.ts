/**
 * 数据库查询函数
 */
import { getDb } from './index';
import { sUser, User } from './schema';

/** 用户查询结果类型 */
export interface UserQueryResult {
  id: number;
  nickname: string | null;
  avatar: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  status: string;
  createTime: Date;
}

/**
 * 获取用户数据（支持分页）
 * @param limit - 限制条数，默认 10
 * @param offset - 偏移量，默认 0
 */
export async function getUsers(limit: number = 10, offset: number = 0): Promise<UserQueryResult[]> {
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


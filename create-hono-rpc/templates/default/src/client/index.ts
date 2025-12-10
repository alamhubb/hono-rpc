/**
 * 客户端示例
 * 直接调用 API 函数，自动发送 HTTP 请求
 */
import { getUsers, createUser, searchUsers, updateUser, deleteUser } from '../api/index.js';

async function main() {
  console.log('🚀 Hono RPC Client Demo\n');

  // 获取所有用户
  console.log('1. Get all users:');
  const users = await getUsers();
  console.log(users);
  console.log();

  // 搜索用户（带分页）
  console.log('2. Search users (page 1, limit 1):');
  const searchResult = await searchUsers({ page: 1, limit: 1 });
  console.log(searchResult);
  console.log();

  // 创建用户
  console.log('3. Create user:');
  const newUser = await createUser({ name: 'Charlie', email: 'charlie@example.com' });
  console.log(newUser);
  console.log();

  // 更新用户
  console.log('4. Update user:');
  const updatedUser = await updateUser({ id: newUser.id, name: 'Charlie Updated', email: 'charlie@example.com' });
  console.log(updatedUser);
  console.log();

  // 删除用户
  console.log('5. Delete user:');
  const deleteResult = await deleteUser({ id: newUser.id });
  console.log(deleteResult);
  console.log();

  // 最终用户列表
  console.log('6. Final users:');
  const finalUsers = await getUsers();
  console.log(finalUsers);
}

main().catch(console.error);

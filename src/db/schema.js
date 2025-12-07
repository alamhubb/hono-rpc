/**
 * Drizzle ORM Schema - s_user 表
 */
import { mysqlTable, int, bigint, varchar, text, timestamp } from 'drizzle-orm/mysql-core';

export const sUser = mysqlTable('s_user', {
  id: int('id').primaryKey().autoincrement(),
  createTime: timestamp('create_time').notNull().defaultNow(),
  userId: bigint('user_id', { mode: 'number' }),
  updateTime: timestamp('update_time').notNull().defaultNow(),
  sequenceNum: int('sequence_num'),
  status: varchar('status', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }),
  content: text('content'),
  contentType: varchar('content_type', { length: 255 }).notNull(),
  deleteReason: varchar('delete_reason', { length: 255 }),
  devId: int('dev_id').notNull(),
  reportNum: int('report_num').notNull(),
  unionId: bigint('union_id', { mode: 'number' }).notNull(),
  violateType: varchar('violate_type', { length: 255 }),
  age: int('age'),
  avatar: varchar('avatar', { length: 255 }),
  birthday: varchar('birthday', { length: 255 }),
  city: varchar('city', { length: 255 }),
  gender: varchar('gender', { length: 255 }),
  nickname: varchar('nickname', { length: 255 }),
  roleId: varchar('role_id', { length: 255 }),
});


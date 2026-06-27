import { pgTable, text, timestamp, boolean, integer, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Better Auth tables
export const user = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name'),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image:         text('image'),
  // Legacy field kept for Better Auth compatibility
  role:          text('role').notNull().default('user'),
  // Platform-level role: 'owner' = you (the SaaS owner), 'user' = everyone else
  platformRole:  text('platformRole').notNull().default('user'),
  createdAt:     timestamp('createdAt').notNull().defaultNow(),
  updatedAt:     timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  expiresAt: timestamp('expiresAt'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// App-specific tables
// Links a user to a school with a role. One school per user (unique on userId).
export const schoolMember = pgTable('school_member', {
  id:        text('id').primaryKey(),
  userId:    text('userId').notNull().unique(), // one school per user
  schoolId:  text('schoolId').notNull(),
  role:      text('role').notNull().default('learner'), // 'school_admin' | 'learner'
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const school = pgTable('school', {
  id:        text('id').primaryKey(),
  slug:      text('slug').notNull().unique(),   // used as the S3 folder prefix
  name:      text('name').notNull(),
  logoUrl:   text('logoUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const course = pgTable('course', {
  id:          text('id').primaryKey(),
  schoolId:    text('schoolId'),               // nullable for backward compat with existing rows
  title:       text('title').notNull(),
  description: text('description'),
  thumbnail:   text('thumbnail'),
  instructor:  text('instructor'),
  isPublished: boolean('isPublished').notNull().default(false),
  createdAt:   timestamp('createdAt').notNull().defaultNow(),
  updatedAt:   timestamp('updatedAt').notNull().defaultNow(),
});

export const module = pgTable('module', {
  id: text('id').primaryKey(),
  courseId: text('courseId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const video = pgTable('video', {
  id: text('id').primaryKey(),
  moduleId: text('moduleId').notNull(),
  title: text('title').notNull(),
  url: text('url'),
  youtubeUrl: text('youtubeUrl'),
  duration: integer('duration'),
  order: integer('order').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const pdf = pgTable('pdf', {
  id: text('id').primaryKey(),
  moduleId: text('moduleId').notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const courseEnrollment = pgTable(
  'course_enrollment',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    courseId: text('courseId').notNull(),
    enrolledAt: timestamp('enrolledAt').notNull().defaultNow(),
    completedAt: timestamp('completedAt'),
  },
  (table) => [unique('unique_user_course').on(table.userId, table.courseId)]
);

export const userProgress = pgTable(
  'user_progress',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    courseId: text('courseId').notNull(),
    moduleId: text('moduleId').notNull(),
    videoId: text('videoId'),
    videoPosition: integer('videoPosition').default(0),
    isModuleCompleted: boolean('isModuleCompleted').notNull().default(false),
    completedAt: timestamp('completedAt'),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [unique('unique_user_course_module').on(table.userId, table.courseId, table.moduleId)]
);

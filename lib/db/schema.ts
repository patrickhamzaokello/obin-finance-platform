import { pgTable, text, timestamp, boolean, integer, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Better Auth tables
export const user = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name'),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image:         text('image'),
  // Platform-level role: 'owner' = platform owner, 'user' = everyone else
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
  id:                text('id').primaryKey(),
  slug:              text('slug').notNull().unique(),
  name:              text('name').notNull(),
  logoUrl:           text('logoUrl'),
  bannerUrl:         text('bannerUrl'),                   // creator profile banner image
  bio:               text('bio'),                         // creator short bio
  category:          text('category'),                    // e.g. "Finance", "Tech", "Fitness"
  socialLinks:       text('socialLinks'),                 // JSON: { twitter, instagram, youtube, website }
  commissionPercent: integer('commissionPercent').notNull().default(0),
  createdAt:         timestamp('createdAt').notNull().defaultNow(),
  updatedAt:         timestamp('updatedAt').notNull().defaultNow(),
});

export const course = pgTable('course', {
  id:              text('id').primaryKey(),
  schoolId:        text('schoolId'),
  title:           text('title').notNull(),
  description:     text('description'),
  thumbnail:       text('thumbnail'),
  instructor:      text('instructor'),
  isPublished:     boolean('isPublished').notNull().default(false),
  price:           integer('price').default(0),           // UGX, 0 = free
  discountPercent: integer('discountPercent').default(0), // 0–100
  discountActive:  boolean('discountActive').notNull().default(false),
  createdAt:       timestamp('createdAt').notNull().defaultNow(),
  updatedAt:       timestamp('updatedAt').notNull().defaultNow(),
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
    id:                  text('id').primaryKey(),
    userId:              text('userId').notNull(),
    courseId:            text('courseId').notNull(),
    enrolledAt:          timestamp('enrolledAt').notNull().defaultNow(),
    completedAt:         timestamp('completedAt'),
    priceAtEnrollment:   integer('priceAtEnrollment').notNull().default(0), // effective price when enrolled
    platformFee:         integer('platformFee').notNull().default(0),       // platform's cut (UGX)
  },
  (table) => [unique('unique_user_course').on(table.userId, table.courseId)]
);

// Access codes — generated by admins, activated once by a specific learner to unlock a course
export const courseAccessCode = pgTable('course_access_code', {
  id:               text('id').primaryKey(),
  courseId:         text('courseId').notNull(),
  code:             text('code').notNull().unique(),
  createdBy:        text('createdBy').notNull(),         // admin userId
  createdAt:        timestamp('createdAt').notNull().defaultNow(),
  codeExpiresAt:    timestamp('codeExpiresAt'),          // code must be used before this date (null = never)
  usedBy:           text('usedBy'),                      // userId who activated — null until used
  usedAt:           timestamp('usedAt'),
  accessExpiresAt:  timestamp('accessExpiresAt'),        // when this granted access expires (null = permanent)
  label:            text('label'),                       // optional admin note, e.g. "for Aaron Peter"
});

export const certificate = pgTable(
  'certificate',
  {
    id:             text('id').primaryKey(),
    userId:         text('userId').notNull(),
    courseId:       text('courseId').notNull(),
    issuedAt:       timestamp('issuedAt').notNull().defaultNow(),
    // Snapshot so the cert stays accurate even if course/user data changes
    learnerName:    text('learnerName').notNull(),
    courseTitle:    text('courseTitle').notNull(),
    instructorName: text('instructorName'),
    schoolName:     text('schoolName'),
  },
  (table) => [unique('unique_cert_user_course').on(table.userId, table.courseId)]
);

export const courseReview = pgTable(
  'course_review',
  {
    id:        text('id').primaryKey(),
    userId:    text('userId').notNull(),
    courseId:  text('courseId').notNull(),
    schoolId:  text('schoolId'),
    rating:    integer('rating').notNull(),        // 1–5
    comment:   text('comment'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    // Snapshot so review stays meaningful if user/course changes
    learnerName:  text('learnerName'),
    courseTitle:  text('courseTitle'),
  },
  (table) => [unique('unique_review_user_course').on(table.userId, table.courseId)]
);

export const supportMessage = pgTable('support_message', {
  id:        text('id').primaryKey(),
  userId:    text('userId').notNull(),
  schoolId:  text('schoolId').notNull(),
  subject:   text('subject').notNull(),
  body:      text('body').notNull(),
  status:    text('status').notNull().default('open'),   // 'open' | 'resolved'
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  // Snapshot
  senderName:  text('senderName'),
  senderEmail: text('senderEmail'),
});

export const creatorApplication = pgTable('creator_application', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  email:       text('email').notNull(),
  phone:       text('phone').notNull(),
  socialLink:  text('socialLink').notNull(),   // TikTok / YouTube URL
  channelName: text('channelName').notNull(),   // desired creator name / channel title
  bio:         text('bio'),                     // optional intro from applicant
  status:      text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  notes:       text('notes'),                   // internal reviewer notes
  schoolId:    text('schoolId'),                // set on approval
  createdAt:   timestamp('createdAt').notNull().defaultNow(),
  reviewedAt:  timestamp('reviewedAt'),
});

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

// lib/schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
  jsonb,
  date,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 255 }),
  avatar: text("avatar"),
  emailVerified: timestamp("email_verified"),
  plan: varchar("plan", { length: 50 }).notNull().default("free"), // free, starter, growth, enterprise
  queryCount: integer("query_count").default(0),
  lastQueryReset: date("last_query_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// NextAuth required tables
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires").notNull(),
});

// Database connections
export const databaseConnections = pgTable("database_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  host: varchar("host", { length: 255 }),
  port: integer("port"),
  database: varchar("database", { length: 255 }),
  username: varchar("username", { length: 255 }),
  passwordEncrypted: text("password_encrypted"),
  connectionUrlEncrypted: text("connection_url_encrypted"),
  ssl: boolean("ssl").default(false),
  isActive: boolean("is_active").default(true),
  lastTestedAt: timestamp("last_tested_at"),
  testStatus: varchar("test_status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
    .notNull()
    .unique(),
  plan: varchar("plan", { length: 50 }).notNull(), // starter, growth, enterprise
  status: varchar("status", { length: 50 }).notNull(), // active, canceled, past_due, etc.
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Usage tracking
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  queryCount: integer("query_count").default(0),
  aiCostCents: integer("ai_cost_cents").default(0),
  exportCount: integer("export_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// CHAT SESSIONS
// ============================================
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  connectionId: uuid("connection_id")
    .references(() => databaseConnections.id, { onDelete: "cascade" })
    .notNull(),
  
  title: varchar("title", { length: 500 }).notNull(), // From first user message
  messageCount: integer("message_count").default(0).notNull(), // Track for limits
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_sessions_user_updated").on(table.userId, table.updatedAt),
  connectionIdx: index("idx_sessions_connection").on(table.connectionId),
}));

// ============================================
// CHAT MESSAGES
// ============================================
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => chatSessions.id, { onDelete: "cascade" })
    .notNull(),
  
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(), // User question OR assistant interpretation
  
  // Metadata (only for assistant messages)
  metadata: jsonb("metadata").$type<{
    sql?: string;
    results?: any[];
    executionTimeMs?: number;
    rowCount?: number;
    dbType?: string;
    error?: string;
    fromCache?: boolean;
    cacheKey?: string;
    isDeepAnalysis?: boolean;
    deepAnalysisSteps?: Array<{
      stepNumber: number;
      question: string;
      sql: string;
      results: any[];
      insights: string;
    }>;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("idx_messages_session_created").on(table.sessionId, table.createdAt),
}));

// ============================================
// RELATIONS
// ============================================
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  connection: one(databaseConnections, {
    fields: [chatSessions.connectionId],
    references: [databaseConnections.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  connections: many(databaseConnections),
  chatSessions: many(chatSessions),
  subscriptions: many(subscriptions),
  usage: many(usageTracking),
}));

export const databaseConnectionsRelations = relations(
  databaseConnections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [databaseConnections.userId],
      references: [users.id],
    }),
    chatSessions: many(chatSessions),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

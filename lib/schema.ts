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

// Database connections - FIXED: Made fields nullable to match migration
export const databaseConnections = pgTable("database_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // postgresql, mysql
  host: varchar("host", { length: 255 }), // NULLABLE - can use URL instead
  port: integer("port"), // NULLABLE - can use URL instead
  database: varchar("database", { length: 255 }), // NULLABLE - can use URL instead
  username: varchar("username", { length: 255 }), // NULLABLE - can use URL instead
  passwordEncrypted: text("password_encrypted"), // NULLABLE - can use URL instead
  connectionUrlEncrypted: text("connection_url_encrypted"), // Store full URL if provided
  ssl: boolean("ssl").default(false),
  isActive: boolean("is_active").default(true),
  lastTestedAt: timestamp("last_tested_at"),
  testStatus: varchar("test_status", { length: 50 }).default("pending"), // pending, success, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Query history
export const queries = pgTable("queries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  connectionId: uuid("connection_id")
    .notNull()
    .references(() => databaseConnections.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  sqlGenerated: text("sql_generated"),
  results: jsonb("results"),
  interpretation: text("interpretation"),
  executionTimeMs: integer("execution_time_ms"),
  rowCount: integer("row_count"),
  isFavorite: boolean("is_favorite").default(false),
  isShared: boolean("is_shared").default(false),
  error: text("error"),
  fromCache: boolean("from_cache").default(false),
  cacheKey: varchar("cache_key", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions (for Stripe integration)
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
  aiCostCents: integer("ai_cost_cents").default(0), // Track AI costs in cents
  exportCount: integer("export_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  connections: many(databaseConnections),
  queries: many(queries),
  subscriptions: many(subscriptions),
  usageTracking: many(usageTracking),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const databaseConnectionsRelations = relations(
  databaseConnections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [databaseConnections.userId],
      references: [users.id],
    }),
    queries: many(queries),
  })
);

export const queriesRelations = relations(queries, ({ one }) => ({
  user: one(users, { fields: [queries.userId], references: [users.id] }),
  connection: one(databaseConnections, {
    fields: [queries.connectionId],
    references: [databaseConnections.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, { fields: [usageTracking.userId], references: [users.id] }),
}));

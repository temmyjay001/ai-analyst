// lib/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Database connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the connection
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the database instance
export const db = drizzle(client, { schema });

// Export the client for cleanup if needed
export { client };

// Types for easier use
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type DatabaseConnection = typeof schema.databaseConnections.$inferSelect;
export type NewDatabaseConnection =
  typeof schema.databaseConnections.$inferInsert;
export type Query = typeof schema.queries.$inferSelect;
export type NewQuery = typeof schema.queries.$inferInsert;
export type Subscription = typeof schema.subscriptions.$inferSelect;
export type NewSubscription = typeof schema.subscriptions.$inferInsert;

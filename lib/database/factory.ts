// lib/database/factory.ts
import { Client as PgClient } from "pg";
import mysql from "mysql2/promise";
import sql from "mssql";
import Database from "better-sqlite3";
import { MongoClient, Db } from "mongodb";
import { decrypt } from "@/lib/encryption";

export type DatabaseType =
  | "postgresql"
  | "mysql"
  | "mssql"
  | "sqlite"
  | "mongodb";

export interface ConnectionConfig {
  id: string;
  type: DatabaseType;
  host?: string | null;
  port?: number | null;
  database?: string | null;
  username?: string | null;
  passwordEncrypted?: string | null;
  connectionUrlEncrypted?: string | null;
  ssl?: boolean | null;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: Array<{ name: string; dataType: string }>;
}

export interface DatabaseConnection {
  connect(): Promise<void>;
  query(sql: string): Promise<QueryResult>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;
}

// PostgreSQL Connection
class PostgresConnection implements DatabaseConnection {
  private readonly client: PgClient;
  private readonly connectionString: string;

  constructor(config: ConnectionConfig) {
    if (config.connectionUrlEncrypted) {
      this.connectionString = decrypt(config.connectionUrlEncrypted);
    } else {
      const password = config.passwordEncrypted
        ? decrypt(config.passwordEncrypted)
        : "";
      const sslParam = config.ssl ? "?sslmode=require" : "";
      this.connectionString = `postgresql://${
        config.username
      }:${encodeURIComponent(password)}@${config.host}:${config.port}/${
        config.database
      }${sslParam}`;
    }

    this.client = new PgClient({
      connectionString: this.connectionString,
      connectionTimeoutMillis: 10000,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async query(sqlQuery: string): Promise<QueryResult> {
    const result = await this.client.query(sqlQuery);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      fields: result.fields?.map((f) => ({
        name: f.name,
        dataType: f.dataTypeID.toString(),
      })),
    };
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.query("SELECT 1");
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }
}

// MySQL Connection
class MySQLConnection implements DatabaseConnection {
  private connection: mysql.Connection | null = null;
  private config: mysql.ConnectionOptions;

  constructor(config: ConnectionConfig) {
    if (config.connectionUrlEncrypted) {
      // Parse MySQL connection string
      const connStr = decrypt(config.connectionUrlEncrypted);
      this.config = { uri: connStr };
    } else {
      const password = config.passwordEncrypted
        ? decrypt(config.passwordEncrypted)
        : "";
      this.config = {
        host: config.host || "localhost",
        port: config.port || 3306,
        user: config.username || "",
        password: password,
        database: config.database || "",
        connectTimeout: 10000,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      };
    }
  }

  async connect(): Promise<void> {
    this.connection = await mysql.createConnection(this.config);
  }

  async query(sqlQuery: string): Promise<QueryResult> {
    if (!this.connection) throw new Error("Not connected");

    const [rows, fields] = await this.connection.query(sqlQuery);

    return {
      rows: Array.isArray(rows) ? rows : [],
      rowCount: Array.isArray(rows) ? rows.length : 0,
      fields: Array.isArray(fields)
        ? fields.map((f: any) => ({
            name: f.name,
            dataType: f.type.toString(),
          }))
        : undefined,
    };
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.query("SELECT 1");
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }
}

// MSSQL Connection
class MSSQLConnection implements DatabaseConnection {
  private pool: sql.ConnectionPool | null = null;
  private config: sql.config;

  constructor(config: ConnectionConfig) {
    if (config.connectionUrlEncrypted) {
      // Parse MSSQL connection string
      const connStr = decrypt(config.connectionUrlEncrypted);

      // MSSQL uses semicolon-separated key-value pairs
      // Example: "Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;"
      const params: any = {};
      connStr.split(";").forEach((part) => {
        const [key, value] = part.split("=");
        if (key && value) {
          const normalizedKey = key.trim().toLowerCase();
          if (normalizedKey === "server") params.server = value.trim();
          else if (normalizedKey === "database") params.database = value.trim();
          else if (normalizedKey === "user id" || normalizedKey === "uid")
            params.user = value.trim();
          else if (normalizedKey === "password" || normalizedKey === "pwd")
            params.password = value.trim();
        }
      });

      this.config = {
        server: params.server || "localhost",
        database: params.database,
        user: params.user,
        password: params.password,
        options: {
          encrypt: config.ssl || false,
          trustServerCertificate: true,
        },
        requestTimeout: 10000,
      };
    } else {
      const password = config.passwordEncrypted
        ? decrypt(config.passwordEncrypted)
        : "";
      this.config = {
        server: config.host || "localhost",
        port: config.port || 1433,
        user: config.username || "",
        password: password,
        database: config.database || "",
        options: {
          encrypt: config.ssl || false,
          trustServerCertificate: true,
        },
        requestTimeout: 10000,
      };
    }
  }

  async connect(): Promise<void> {
    this.pool = await sql.connect(this.config);
  }

  async query(sqlQuery: string): Promise<QueryResult> {
    if (!this.pool) throw new Error("Not connected");

    const result = await this.pool.request().query(sqlQuery);

    return {
      rows: result.recordset || [],
      rowCount: result.recordset?.length || 0,
      fields: result.recordset?.columns
        ? Object.keys(result.recordset.columns).map((name) => ({
            name,
            dataType: result.recordset.columns[name].type.toString(),
          }))
        : undefined,
    };
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.query("SELECT 1");
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }
}

// SQLite Connection
class SQLiteConnection implements DatabaseConnection {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(config: ConnectionConfig) {
    if (config.connectionUrlEncrypted) {
      const path = decrypt(config.connectionUrlEncrypted);
      this.dbPath = path.replace("sqlite://", "").replace("file:", "");
    } else if (config.database) {
      this.dbPath = config.database;
    } else {
      throw new Error("SQLite requires database path");
    }
  }

  async connect(): Promise<void> {
    this.db = new Database(this.dbPath, { readonly: true });
  }

  async query(sqlQuery: string): Promise<QueryResult> {
    if (!this.db) throw new Error("Not connected");

    const rows = this.db.prepare(sqlQuery).all();

    return {
      rows: rows,
      rowCount: rows.length,
    };
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.query("SELECT 1");
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }
}

class MongoDBConnection implements DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private readonly connectionString: string;

  constructor(config: ConnectionConfig) {
    if (config.connectionUrlEncrypted) {
      this.connectionString = decrypt(config.connectionUrlEncrypted);
    } else {
      const password = config.passwordEncrypted
        ? encodeURIComponent(decrypt(config.passwordEncrypted))
        : "";
      this.connectionString = `mongodb://${config.username}:${password}@${
        config.host
      }:${config.port || 27017}/${config.database}`;
    }
  }

  async connect(): Promise<void> {
    this.client = new MongoClient(this.connectionString);
    await this.client.connect();
    this.db = this.client.db();
  }

  async query(queryJson: string): Promise<QueryResult> {
    // MongoDB doesn't use SQL - it uses JSON queries
    // Expected format: { "collection": "users", "operation": "find", "query": {...}, "options": {...} }

    if (!this.db) throw new Error("Not connected");

    try {
      const {
        collection,
        operation,
        query = {},
        options = {},
      } = JSON.parse(queryJson);
      const coll = this.db.collection(collection);

      let results: any[];

      switch (operation) {
        case "find":
          results = await coll.find(query, options).toArray();
          break;
        case "aggregate":
          results = await coll.aggregate(query).toArray();
          break;
        case "count":
          const count = await coll.countDocuments(query);
          results = [{ count }];
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        rows: results,
        rowCount: results.length,
        fields:
          results.length > 0
            ? Object.keys(results[0]).map((key) => ({
                name: key,
                dataType: typeof results[0][key],
              }))
            : undefined,
      };
    } catch (error: any) {
      throw new Error(`MongoDB query error: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.db?.admin().ping();
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }
}

// Factory function
export function createDatabaseConnection(
  config: ConnectionConfig
): DatabaseConnection {
  switch (config.type) {
    case "postgresql":
      return new PostgresConnection(config);
    case "mysql":
      return new MySQLConnection(config);
    case "mssql":
      return new MSSQLConnection(config);
    case "sqlite":
      return new SQLiteConnection(config);
    case "mongodb":
      return new MongoDBConnection(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

// Helper function to execute query safely
export async function executeQuery(
  config: ConnectionConfig,
  sqlQuery: string
): Promise<QueryResult> {
  const connection = createDatabaseConnection(config);

  try {
    await connection.connect();
    const result = await connection.query(sqlQuery);
    return result;
  } finally {
    await connection.disconnect();
  }
}

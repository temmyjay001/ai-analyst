// lib/database/schemaIntrospection.ts
import {
  createDatabaseConnection,
  DatabaseType,
  ConnectionConfig,
} from "./factory";

export interface ColumnInfo {
  column: string;
  type: string;
  nullable: boolean;
  isPrimary?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
}

export interface RelationshipInfo {
  column: string;
  foreign_table: string;
  foreign_column: string;
}

export interface TableSchema {
  table_name: string;
  columns: ColumnInfo[];
  relationships?: RelationshipInfo[];
  indexes?: Array<{ name: string; columns: string[] }>;
}

export interface SchemaContext {
  tables: TableSchema[];
  formatted: string;
}

// PostgreSQL Schema Introspection
async function getPostgreSQLSchema(
  config: ConnectionConfig
): Promise<SchemaContext> {
  const connection = createDatabaseConnection(config);

  try {
    await connection.connect();

    // Get tables and columns
    const schemaResult = await connection.query(`
      SELECT 
        t.table_name,
        json_agg(
          json_build_object(
            'column', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable = 'YES',
            'isPrimary', CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END,
            'defaultValue', c.column_default
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      ORDER BY t.table_name
    `);

    // Get foreign keys
    const fkResult = await connection.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);

    const tables: TableSchema[] = schemaResult.rows.map((table) => ({
      table_name: table.table_name,
      columns: table.columns,
      relationships: fkResult.rows
        .filter((fk) => fk.table_name === table.table_name)
        .map((fk) => ({
          column: fk.column_name,
          foreign_table: fk.foreign_table,
          foreign_column: fk.foreign_column,
        })),
    }));

    return {
      tables,
      formatted: formatSchemaForAI(tables, "postgresql"),
    };
  } finally {
    await connection.disconnect();
  }
}

// MySQL Schema Introspection
async function getMySQLSchema(
  config: ConnectionConfig
): Promise<SchemaContext> {
  const connection = createDatabaseConnection(config);

  try {
    await connection.connect();

    const dbName = config.database || "database";

    // Get tables and columns
    const schemaResult = await connection.query(`
      SELECT 
        t.TABLE_NAME as table_name,
        c.COLUMN_NAME as column_name,
        c.DATA_TYPE as data_type,
        c.IS_NULLABLE as is_nullable,
        c.COLUMN_KEY as column_key,
        c.COLUMN_DEFAULT as column_default
      FROM information_schema.TABLES t
      JOIN information_schema.COLUMNS c 
        ON t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_SCHEMA = c.TABLE_SCHEMA
      WHERE t.TABLE_SCHEMA = '${dbName}'
        AND t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `);

    // Get foreign keys
    const fkResult = await connection.query(`
      SELECT 
        kcu.TABLE_NAME as table_name,
        kcu.COLUMN_NAME as column_name,
        kcu.REFERENCED_TABLE_NAME as foreign_table,
        kcu.REFERENCED_COLUMN_NAME as foreign_column
      FROM information_schema.KEY_COLUMN_USAGE kcu
      WHERE kcu.TABLE_SCHEMA = '${dbName}'
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    `);

    // Group columns by table
    const tablesMap = new Map<string, ColumnInfo[]>();
    for (const row of schemaResult.rows) {
      if (!tablesMap.has(row.table_name)) {
        tablesMap.set(row.table_name, []);
      }
      tablesMap.get(row.table_name)!.push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        isPrimary: row.column_key === "PRI",
        defaultValue: row.column_default,
      });
    }

    const tables: TableSchema[] = Array.from(tablesMap.entries()).map(
      ([table_name, columns]) => ({
        table_name,
        columns,
        relationships: fkResult.rows
          .filter((fk) => fk.table_name === table_name)
          .map((fk) => ({
            column: fk.column_name,
            foreign_table: fk.foreign_table,
            foreign_column: fk.foreign_column,
          })),
      })
    );

    return {
      tables,
      formatted: formatSchemaForAI(tables, "mysql"),
    };
  } finally {
    await connection.disconnect();
  }
}

// MSSQL Schema Introspection
async function getMSSQLSchema(
  config: ConnectionConfig
): Promise<SchemaContext> {
  const connection = createDatabaseConnection(config);

  try {
    await connection.connect();

    // Get tables and columns
    const schemaResult = await connection.query(`
      SELECT 
        t.TABLE_NAME as table_name,
        c.COLUMN_NAME as column_name,
        c.DATA_TYPE as data_type,
        c.IS_NULLABLE as is_nullable,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as is_primary,
        c.COLUMN_DEFAULT as column_default
      FROM INFORMATION_SCHEMA.TABLES t
      JOIN INFORMATION_SCHEMA.COLUMNS c 
        ON t.TABLE_NAME = c.TABLE_NAME
      LEFT JOIN (
        SELECT ku.TABLE_NAME, ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_SCHEMA = 'dbo'
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `);

    // Get foreign keys
    const fkResult = await connection.query(`
      SELECT 
        fk.name as constraint_name,
        tp.name as table_name,
        cp.name as column_name,
        tr.name as foreign_table,
        cr.name as foreign_column
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc 
        ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.tables tp 
        ON fkc.parent_object_id = tp.object_id
      INNER JOIN sys.columns cp 
        ON fkc.parent_object_id = cp.object_id 
        AND fkc.parent_column_id = cp.column_id
      INNER JOIN sys.tables tr 
        ON fkc.referenced_object_id = tr.object_id
      INNER JOIN sys.columns cr 
        ON fkc.referenced_object_id = cr.object_id 
        AND fkc.referenced_column_id = cr.column_id
    `);

    // Group columns by table
    const tablesMap = new Map<string, ColumnInfo[]>();
    for (const row of schemaResult.rows) {
      if (!tablesMap.has(row.table_name)) {
        tablesMap.set(row.table_name, []);
      }
      tablesMap.get(row.table_name)!.push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        isPrimary: row.is_primary === 1,
        defaultValue: row.column_default,
      });
    }

    const tables: TableSchema[] = Array.from(tablesMap.entries()).map(
      ([table_name, columns]) => ({
        table_name,
        columns,
        relationships: fkResult.rows
          .filter((fk) => fk.table_name === table_name)
          .map((fk) => ({
            column: fk.column_name,
            foreign_table: fk.foreign_table,
            foreign_column: fk.foreign_column,
          })),
      })
    );

    return {
      tables,
      formatted: formatSchemaForAI(tables, "mssql"),
    };
  } finally {
    await connection.disconnect();
  }
}

// SQLite Schema Introspection
async function getSQLiteSchema(
  config: ConnectionConfig
): Promise<SchemaContext> {
  const connection = createDatabaseConnection(config);

  try {
    await connection.connect();

    // Get all tables
    const tablesResult = await connection.query(`
      SELECT name as table_name 
      FROM sqlite_master 
      WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tables: TableSchema[] = [];

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;

      // Get columns for each table
      const columnsResult = await connection.query(
        `PRAGMA table_info(${tableName})`
      );

      const columns: ColumnInfo[] = columnsResult.rows.map((col) => ({
        column: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        isPrimary: col.pk === 1,
        defaultValue: col.dflt_value,
      }));

      // Get foreign keys for each table
      const fkResult = await connection.query(
        `PRAGMA foreign_key_list(${tableName})`
      );

      const relationships: RelationshipInfo[] = fkResult.rows.map((fk) => ({
        column: fk.from,
        foreign_table: fk.table,
        foreign_column: fk.to,
      }));

      tables.push({
        table_name: tableName,
        columns,
        relationships: relationships.length > 0 ? relationships : undefined,
      });
    }

    return {
      tables,
      formatted: formatSchemaForAI(tables, "sqlite"),
    };
  } finally {
    await connection.disconnect();
  }
}

// Format schema for AI consumption
function formatSchemaForAI(
  tables: TableSchema[],
  dbType: DatabaseType
): string {
  let context = `DATABASE TYPE: ${dbType.toUpperCase()}\n\n`;
  context += `DATABASE SCHEMA:\n\n`;

  for (const table of tables) {
    context += `TABLE: ${table.table_name}\n`;
    context += `Columns:\n`;

    for (const col of table.columns) {
      let colInfo = `  - ${col.column}: ${col.type}`;
      if (!col.nullable) colInfo += " (required)";
      if (col.isPrimary) colInfo += " [PRIMARY KEY]";
      if (col.defaultValue) colInfo += ` [DEFAULT: ${col.defaultValue}]`;
      context += colInfo + "\n";
    }

    if (table.relationships && table.relationships.length > 0) {
      context += `Foreign Keys:\n`;
      for (const rel of table.relationships) {
        context += `  - ${rel.column} references ${rel.foreign_table}.${rel.foreign_column}\n`;
      }
    }

    if (table.indexes && table.indexes.length > 0) {
      context += `Indexes:\n`;
      for (const idx of table.indexes) {
        context += `  - ${idx.name}: (${idx.columns.join(", ")})\n`;
      }
    }

    context += "\n";
  }

  return context;
}

// Main function to get schema context
export async function getSchemaContext(
  config: ConnectionConfig
): Promise<SchemaContext> {
  switch (config.type) {
    case "postgresql":
      return await getPostgreSQLSchema(config);
    case "mysql":
      return await getMySQLSchema(config);
    case "mssql":
      return await getMSSQLSchema(config);
    case "sqlite":
      return await getSQLiteSchema(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

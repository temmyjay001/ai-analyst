// lib/schema.ts
import { query } from "./db";

export interface TableSchema {
  table_name: string;
  columns: Array<{
    column: string;
    type: string;
    nullable: boolean;
  }>;
  relationships?: Array<{
    column: string;
    foreign_table: string;
    foreign_column: string;
  }>;
  sample_data?: any[];
}

export async function getSchemaContext() {
  try {
    // Get all tables and columns
    const schemaResult = await query(`
      SELECT 
        t.table_name,
        json_agg(
          json_build_object(
            'column', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable = 'YES'
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      ORDER BY t.table_name
    `);

    // Get foreign key relationships
    const fkResult = await query(`
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

    // Build schema with relationships
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

    // Get sample data for each table (just 2 rows to keep context small)
    for (const table of tables) {
      try {
        const sampleResult = await query(
          `SELECT * FROM ${table.table_name} LIMIT 2`
        );
        table.sample_data = sampleResult.rows;
      } catch (err) {
        console.log(`Could not get sample data for ${table.table_name}`);
      }
    }

    return {
      tables,
      formatted: formatForAI(tables),
    };
  } catch (error) {
    console.error("Schema introspection error:", error);
    throw error;
  }
}

function formatForAI(tables: TableSchema[]): string {
  let context = "DATABASE SCHEMA:\n\n";

  for (const table of tables) {
    context += `TABLE: ${table.table_name}\n`;
    context += `Columns:\n`;

    for (const col of table.columns) {
      context += `  - ${col.column}: ${col.type}${
        !col.nullable ? " (required)" : ""
      }\n`;
    }

    if (table.relationships && table.relationships.length > 0) {
      context += `Foreign Keys:\n`;
      for (const rel of table.relationships) {
        context += `  - ${rel.column} references ${rel.foreign_table}.${rel.foreign_column}\n`;
      }
    }

    if (table.sample_data && table.sample_data.length > 0) {
      context += `Sample row: ${JSON.stringify(
        table.sample_data[0],
        null,
        2
      )}\n`;
    }

    context += "\n";
  }

  return context;
}

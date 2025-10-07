// lib/ai/sqlGenerator.ts
import { DatabaseType } from "../database/factory";

/**
 * Get database-specific SQL syntax rules and limitations
 */
export function getDatabaseSyntaxRules(dbType: DatabaseType): string {
  switch (dbType) {
    case "postgresql":
      return `PostgreSQL SYNTAX RULES:
        - Use double quotes for identifiers with special characters: "column name"
        - String literals use single quotes: 'value'
        - Supports: CTEs (WITH), window functions, JSONB operations
        - Date functions: NOW(), CURRENT_DATE, INTERVAL '1 day'
        - String concat: || operator or CONCAT()
        - Limit: LIMIT n OFFSET m
        - Case-insensitive LIKE: ILIKE
        - Boolean type: TRUE/FALSE
        - Auto-increment: SERIAL or GENERATED ALWAYS AS IDENTITY
        - Comments: -- or /* */`;

    case "mysql":
      return `MySQL SYNTAX RULES:
        - Use backticks for identifiers with special characters: \`column name\`
        - String literals use single quotes: 'value'
        - Limited window function support (MySQL 8.0+)
        - Date functions: NOW(), CURDATE(), DATE_ADD()
        - String concat: CONCAT() function only
        - Limit: LIMIT n OFFSET m (or LIMIT m, n)
        - Case-insensitive by default (depends on collation)
        - Boolean stored as TINYINT(1): 1/0
        - Auto-increment: AUTO_INCREMENT
        - Comments: -- or /* */ or #
        - No support for: FILTER clause, DISTINCT ON
        `;

    case "mssql":
      return `SQL Server (MSSQL) SYNTAX RULES:
        - Use square brackets for identifiers: [column name]
        - String literals use single quotes: 'value'
        - Full window function support
        - Date functions: GETDATE(), DATEADD(), DATEDIFF()
        - String concat: + operator or CONCAT()
        - Pagination: OFFSET n ROWS FETCH NEXT m ROWS ONLY
        - No LIMIT keyword - use TOP or OFFSET/FETCH
        - Boolean stored as BIT: 1/0
        - Auto-increment: IDENTITY(1,1)
        - Comments: -- or /* */
        - Schema prefix often required: dbo.TableName
        - No support for: ILIKE (use COLLATE)`;

    case "sqlite":
      return `SQLite SYNTAX RULES:
        - Use double quotes or brackets for identifiers: "column name" or [column name]
        - String literals use single quotes: 'value'
        - Limited window function support (3.25.0+)
        - Date functions: date(), datetime(), strftime()
        - String concat: || operator only
        - Limit: LIMIT n OFFSET m
        - Case-insensitive LIKE by default
        - Boolean stored as INTEGER: 1/0
        - Auto-increment: AUTOINCREMENT (INTEGER PRIMARY KEY auto-increments)
        - Comments: -- or /* */
        - No support for: RIGHT JOIN, FULL OUTER JOIN
        - Type affinity (flexible typing)`;

    default:
      return "";
  }
}

/**
 * Get database-specific query examples
 */
export function getDatabaseExamples(dbType: DatabaseType): string {
  const examples = {
    postgresql: `
        EXAMPLES:
        -- Get top 10 users by creation date
        SELECT id, name, email, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10;

        -- Count users by status with percentage
        SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
        FROM users
        GROUP BY status
        ORDER BY count DESC;

        -- Get recent orders with customer info
        SELECT o.id, o.total, c.name as customer_name, o.created_at
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.created_at > NOW() - INTERVAL '30 days'
        ORDER BY o.created_at DESC
        LIMIT 20;`,

    mysql: `
        EXAMPLES:
        -- Get top 10 users by creation date
        SELECT id, name, email, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10;

        -- Count users by status with percentage
        SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
        FROM users
        GROUP BY status
        ORDER BY count DESC;

        -- Get recent orders with customer info
        SELECT o.id, o.total, c.name as customer_name, o.created_at
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY o.created_at DESC
        LIMIT 20;`,

    mssql: `
        EXAMPLES:
        -- Get top 10 users by creation date
        SELECT TOP 10 id, name, email, created_at 
        FROM dbo.users 
        ORDER BY created_at DESC;

        -- Count users by status with percentage
        SELECT 
        status,
        COUNT(*) as count,
        CAST(ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS DECIMAL(5,2)) as percentage
        FROM dbo.users
        GROUP BY status
        ORDER BY count DESC;

        -- Get recent orders with customer info (pagination)
        SELECT o.id, o.total, c.name as customer_name, o.created_at
        FROM dbo.orders o
        JOIN dbo.customers c ON o.customer_id = c.id
        WHERE o.created_at > DATEADD(day, -30, GETDATE())
        ORDER BY o.created_at DESC
        OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;`,

    sqlite: `
        EXAMPLES:
        -- Get top 10 users by creation date
        SELECT id, name, email, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10;

        -- Count users by status with percentage
        SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
        FROM users
        GROUP BY status
        ORDER BY count DESC;

        -- Get recent orders with customer info
        SELECT o.id, o.total, c.name as customer_name, o.created_at
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.created_at > datetime('now', '-30 days')
        ORDER BY o.created_at DESC
        LIMIT 20;`,
  };

  return examples[dbType] || "";
}

/**
 * Get visualization-specific guidance for database type
 */
export function getVisualizationGuidance(dbType: DatabaseType): string {
  const baseGuidance = `
    CRITICAL VISUALIZATION REQUIREMENTS:
    1. **ALWAYS INCLUDE AGGREGATIONS** for counting/filtering queries
    2. **SELECT ONLY CHART-RELEVANT COLUMNS** (2-3 max: categorical + numeric)
    3. **STRUCTURE FOR CHART TYPES**:
    - Bar/Pie: category column + COUNT/SUM/AVG
    - Line: date/time column + numeric metric
    - Use meaningful column aliases
    4. **ALWAYS ADD ORDER BY** for meaningful visualizations
    5. **LIMIT RESULTS**: 20 for bar/pie, 100 for time series
    `;

  const dbSpecific = {
    postgresql: `
        PostgreSQL-specific tips:
        - Use LIMIT for result limiting
        - Use EXTRACT(epoch FROM date_col) for timestamp math
        - Use TO_CHAR() for date formatting in aggregations`,

    mysql: `
        MySQL-specific tips:
        - Use LIMIT for result limiting
        - Use UNIX_TIMESTAMP() for timestamp math
        - Use DATE_FORMAT() for date formatting in aggregations`,

    mssql: `
        SQL Server-specific tips:
        - Use TOP or OFFSET/FETCH for result limiting
        - Use DATEDIFF() for date calculations
        - Use FORMAT() or CONVERT() for date formatting`,

    sqlite: `
        SQLite-specific tips:
        - Use LIMIT for result limiting
        - Use strftime() for date formatting and extraction
        - Use julianday() for date calculations`,
  };

  return baseGuidance + (dbSpecific[dbType] || "");
}

/**
 * Build complete system instruction for SQL generation
 */
export function buildSQLGenerationPrompt(
  dbType: DatabaseType,
  schemaInfo: string,
  question: string,
  useVisualizationMode: boolean = true
): string {
  const syntaxRules = getDatabaseSyntaxRules(dbType);
  const examples = getDatabaseExamples(dbType);
  const visualizationGuidance = useVisualizationMode
    ? getVisualizationGuidance(dbType)
    : "";

  return `You are a ${dbType.toUpperCase()} expert that generates queries optimized for data accuracy and visualization.

        ${syntaxRules}

        DATABASE SCHEMA:
        ${schemaInfo}

        ${visualizationGuidance}

        ${examples}

        CRITICAL RULES:
        - Return ONLY the SQL query, no explanations or markdown
        - Use proper ${dbType.toUpperCase()} syntax as shown above
        - Only read-only operations (SELECT, WITH/CTEs)
        - Never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE
        - Test query logic mentally before generating

        USER QUESTION: ${question}

        Generate a ${dbType.toUpperCase()}-compatible SQL query that answers this question.`;
}

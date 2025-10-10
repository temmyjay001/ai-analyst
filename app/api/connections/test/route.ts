// app/api/connections/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createDatabaseConnection, DatabaseType } from "@/lib/database/factory";
import { encrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      host,
      port,
      database,
      username,
      password,
      ssl,
      connectionUrl,
    } = body;

    // Validate database type
    const validTypes: DatabaseType[] = [
      "postgresql",
      "mysql",
      "mssql",
      "sqlite",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          message: `Unsupported database type: ${type}. Supported: ${validTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Create temporary config for testing
    const testConfig = {
      id: "test-connection",
      type: type as DatabaseType,
      host,
      port,
      database,
      username,
      passwordEncrypted: password ? encrypt(password) : null, // Not encrypted for test
      connectionUrlEncrypted: connectionUrl ? encrypt(connectionUrl) : null,
      ssl,
    };

    try {
      // Use factory to create connection
      const connection = createDatabaseConnection(testConfig);

      // Test the connection
      const isConnected = await connection.testConnection();

      if (isConnected) {
        return NextResponse.json({
          success: true,
          message: `${type.toUpperCase()} connection successful!`,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: `Failed to connect to ${type.toUpperCase()} database`,
          },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error(`${type} connection error:`, error);

      // Provide helpful error messages based on database type
      let helpMessage = "";
      switch (type) {
        case "mysql":
          helpMessage =
            "Common issues: Check host/port (usually 3306), verify user permissions, ensure MySQL is running.";
          break;
        case "mssql":
          helpMessage =
            "Common issues: Check host/port (usually 1433), verify SQL Server authentication mode, check firewall settings.";
          break;
        case "sqlite":
          helpMessage =
            "Common issues: Verify file path exists and is accessible, check file permissions.";
          break;
        case "postgresql":
          helpMessage =
            "Common issues: Check host/port (usually 5432), verify SSL settings, ensure PostgreSQL is running.";
          break;
      }

      return NextResponse.json(
        {
          success: false,
          message: `Connection failed: ${error.message}`,
          help: helpMessage,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Test connection error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to test connection",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

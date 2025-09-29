// app/api/connections/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Client } from "pg";

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

    if (type !== "postgresql") {
      return NextResponse.json(
        { message: "Only PostgreSQL is supported in this version" },
        { status: 400 }
      );
    }

    let finalConnectionString: string;

    // Use connection URL if provided, otherwise build from parts
    if (connectionUrl) {
      finalConnectionString = connectionUrl;
    } else {
      // Build connection string from individual parts
      const sslParam = ssl ? "?sslmode=require" : "";
      finalConnectionString = `postgresql://${username}:${encodeURIComponent(
        password
      )}@${host}:${port}/${database}${sslParam}`;
    }

    const client = new Client({
      connectionString: finalConnectionString,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();

      // Test with a simple query
      await client.query("SELECT 1");

      await client.end();

      return NextResponse.json({
        success: true,
        message: "Connection successful!",
      });
    } catch (error: any) {
      await client.end().catch(() => {});

      return NextResponse.json(
        {
          success: false,
          message: `Connection failed: ${error.message}`,
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
      },
      { status: 500 }
    );
  }
}

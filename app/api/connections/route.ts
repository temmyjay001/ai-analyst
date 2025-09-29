// app/api/connections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { databaseConnections, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const connections = await db
      .select({
        id: databaseConnections.id,
        name: databaseConnections.name,
        type: databaseConnections.type,
        host: databaseConnections.host,
        port: databaseConnections.port,
        database: databaseConnections.database,
        username: databaseConnections.username,
        isActive: databaseConnections.isActive,
        lastTestedAt: databaseConnections.lastTestedAt,
        testStatus: databaseConnections.testStatus,
        createdAt: databaseConnections.createdAt,
      })
      .from(databaseConnections)
      .where(eq(databaseConnections.userId, user[0].id));

    return NextResponse.json(connections);
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    return NextResponse.json(
      { message: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check connection limits based on plan
    const existingConnections = await db
      .select()
      .from(databaseConnections)
      .where(eq(databaseConnections.userId, user[0].id));

    const connectionLimits: Record<string, number> = {
      free: 1,
      starter: 3,
      growth: 10,
      enterprise: 999,
    };

    const userPlan = user[0].plan || "free";
    const userLimit = connectionLimits[userPlan] || 1;

    if (existingConnections.length >= userLimit) {
      return NextResponse.json(
        {
          message: `Connection limit reached (${userLimit} ${
            userLimit === 1 ? "connection" : "connections"
          }). Upgrade your plan to add more.`,
          limit: userLimit,
          current: existingConnections.length,
        },
        { status: 403 }
      );
    }

    const {
      name,
      type,
      host,
      port,
      database,
      username,
      password,
      ssl,
      connectionUrl,
    } = await req.json();

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { message: "Connection name and type are required" },
        { status: 400 }
      );
    }

    // Check if using connection URL or manual entry
    if (connectionUrl) {
      // Store encrypted connection URL
      const encryptedUrl = encrypt(connectionUrl);

      const newConnection = await db
        .insert(databaseConnections)
        .values({
          userId: user[0].id,
          name: name.trim(),
          type,
          host: host || null,
          port: port ? parseInt(port) : null,
          database: database || null,
          username: username || null,
          passwordEncrypted: null,
          connectionUrlEncrypted: encryptedUrl,
          ssl: ssl || false,
          testStatus: "success",
          lastTestedAt: new Date(),
        })
        .returning();

      return NextResponse.json(newConnection[0], { status: 201 });
    } else {
      // Manual entry - validate all fields
      if (!host || !port || !database || !username || !password) {
        return NextResponse.json(
          { message: "All connection fields are required for manual entry" },
          { status: 400 }
        );
      }

      // Encrypt password
      const encryptedPassword = encrypt(password);

      const newConnection = await db
        .insert(databaseConnections)
        .values({
          userId: user[0].id,
          name: name.trim(),
          type,
          host: host.trim(),
          port: parseInt(port),
          database: database.trim(),
          username: username.trim(),
          passwordEncrypted: encryptedPassword,
          connectionUrlEncrypted: null,
          ssl: ssl || false,
          testStatus: "success",
          lastTestedAt: new Date(),
        })
        .returning();

      return NextResponse.json(newConnection[0], { status: 201 });
    }
  } catch (error) {
    console.error("Failed to create connection:", error);
    return NextResponse.json(
      { message: "Failed to create connection" },
      { status: 500 }
    );
  }
}

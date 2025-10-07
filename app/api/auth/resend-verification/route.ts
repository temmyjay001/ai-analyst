// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (user.length === 0) {
      // Don't reveal if user exists for security
      return NextResponse.json(
        {
          message:
            "If an account exists with this email, a verification link will be sent.",
          success: true,
        },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user[0].emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Check for recent verification token (rate limiting)
    const recentToken = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, user[0].email),
          gt(
            verificationTokens.expires,
            new Date(Date.now() + 23.5 * 60 * 60 * 1000)
          ) // Created less than 30 min ago
        )
      )
      .limit(1);

    if (recentToken.length > 0) {
      return NextResponse.json(
        {
          message:
            "A verification email was recently sent. Please check your inbox or wait a few minutes before requesting another.",
        },
        { status: 429 }
      );
    }

    // Delete any existing tokens for this email
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, user[0].email));

    // Generate new verification token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store new verification token
    await db.insert(verificationTokens).values({
      identifier: user[0].email,
      token,
      expires,
    });

    // Send verification email
    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";
    const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;

    try {
      await sendVerificationEmail({
        email: user[0].email,
        name: user[0].name,
        verificationUrl,
      });

      return NextResponse.json(
        {
          message:
            "Verification email sent successfully. Please check your inbox.",
          success: true,
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        {
          message: "Failed to send verification email. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

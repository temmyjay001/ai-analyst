// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendVerificationEmailParams {
  email: string;
  name: string;
  verificationUrl: string;
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail({
  email,
  name,
  verificationUrl,
}: SendVerificationEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: "WhoPrompt <noreply@whoprompt.com>",
      to: email,
      subject: "Verify your email address",
      text: `Hi ${name},

Welcome to WhoPrompt! Please verify your email address to get started.

Click the link below to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with WhoPrompt, you can safely ignore this email.

Thanks,
The WhoPrompt Team`,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "WhoPrompt <noreply@whoprompt.com>",
      to: email,
      subject: "Reset your password",
      text: `Hi ${name},

We received a request to reset your password for your WhoPrompt account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

Thanks,
The WhoPrompt Team`,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

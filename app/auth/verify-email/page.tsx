"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "already-verified"
  >("loading");
  const [message, setMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "Invalid verification link. Please check your email for the correct link."
      );
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyVerified) {
          setStatus("already-verified");
          setMessage("Your email is already verified. You can sign in now.");
        } else {
          setStatus("success");
          setMessage("Your email has been verified successfully!");

          // Auto-redirect to app after 2 seconds
          setTimeout(() => {
            handleSignIn();
          }, 2000);
        }
      } else {
        setStatus("error");
        setMessage(
          data.message || "Failed to verify email. The link may have expired."
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    router.push("/auth/signin?verified=true");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 dark:bg-emerald-900 rounded-full p-3">
              {status === "loading" && (
                <Loader2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400 animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              )}
              {status === "already-verified" && (
                <CheckCircle2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              )}
              {status === "error" && (
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {status === "loading" && "Verifying Your Email"}
            {status === "success" && "Email Verified!"}
            {status === "already-verified" && "Already Verified"}
            {status === "error" && "Verification Failed"}
          </h1>

          {/* Message */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {status === "success" && (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>Continue to App</>
                )}
              </button>
            )}

            {status === "already-verified" && (
              <Link
                href="/auth/signin"
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign In
              </Link>
            )}

            {status === "error" && (
              <>
                <Link
                  href="/auth/signin"
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/auth/resend-verification"
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Request New Verification Link
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Need help?{" "}
          <a
            href="mailto:support@whoprompt.com"
            className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

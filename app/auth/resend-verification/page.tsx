"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail(""); // Clear the email field
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to send verification email");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <Link
            href="/auth/signin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sign In
          </Link>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 dark:bg-emerald-900 rounded-full p-3">
              <Mail className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Resend Verification Email
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Enter your email address and we&apos;ll send you a new verification link
          </p>

          {/* Success Message */}
          {status === "success" && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {message}
              </p>
            </div>
          )}

          {/* Error Message */}
          {status === "error" && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {message}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Verification Email
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Check your spam folder if you don&apos;t receive the email within a few
              minutes.
            </p>
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

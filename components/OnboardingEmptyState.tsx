// components/OnboardingEmptyState.tsx
"use client";

import { useState } from "react";
import { Database, Zap, Shield, TrendingUp, ArrowRight } from "lucide-react";
import ConnectionForm from "./ConnectionForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingEmptyState() {
  const [showConnectionForm, setShowConnectionForm] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center min-h-full p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl w-full space-y-8">
          {/* Welcome Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Welcome to WhoPrompt! 🎉
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Let&apos;s get you started by connecting your first database. Once
              connected, you can start asking questions in plain English.
            </p>
          </div>

          {/* CTA Card */}
          <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Connect Your Database</CardTitle>
              <CardDescription className="text-base">
                It only takes a minute to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Zap className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Instant Insights
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ask questions in plain English, get SQL results instantly
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Secure & Encrypted
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your credentials are encrypted with AES-256-GCM
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <TrendingUp className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Smart Analysis
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI-powered insights and visualizations automatically
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setShowConnectionForm(true)}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg"
                >
                  <Database className="h-5 w-5 mr-2" />
                  Add Your First Connection
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>

              {/* Supported Databases */}
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Supported Databases
                </p>
                <div className="flex items-center justify-center space-x-6 text-2xl">
                  <span title="PostgreSQL">🐘</span>
                  <span title="MySQL">🐬</span>
                  <span title="SQL Server">🔷</span>
                  <span title="SQLite">💾</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>
              💡 <strong>Tip:</strong> You can use a connection URL for quick
              setup, or enter credentials manually
            </p>
            <p>
              🔒 <strong>Security:</strong> We only execute read-only queries -
              your data is never modified
            </p>
          </div>
        </div>
      </div>

      {/* Connection Form Modal */}
      {showConnectionForm && (
        <ConnectionForm
          onCancel={() => setShowConnectionForm(false)}
          onSuccess={() => {
            setShowConnectionForm(false);
            window.location.reload(); // Refresh to show the new connection
          }}
        />
      )}
    </>
  );
}

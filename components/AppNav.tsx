"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  MessageCircle,
  Settings,
  LogOut,
  User,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";
import UsageDisplay from "./UsageDisplay";
import { useUserStore } from "@/store/userStore";

export default function AppNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const plan = useUserStore((state) => state.plan);
  const hasStarterAccess = ["starter", "growth", "enterprise"].includes(plan);

  const navItems = [
    // { href: "/app", label: "Chat", icon: MessageCircle },
    { href: "/connections", label: "Connections", icon: Database },
    {
      href: "/dashboards",
      label: "Dashboards",
      icon: LayoutDashboard,
      badge: !hasStarterAccess ? "Starter+" : null,
    },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <nav className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/app" className="flex items-center">
            <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              WhoPrompt
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <UsageDisplay />

            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {plan} Plan
                </p>
              </div>
              <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center space-x-1 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive(item.href)
                    ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
                {item.badge && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

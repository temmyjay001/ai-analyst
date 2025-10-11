// app/(dashboard)/app/layout.tsx

"use client";

import ChatSidebar from "@/components/ChatSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* <ChatSidebar /> */}

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

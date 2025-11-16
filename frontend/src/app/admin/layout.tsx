"use client";

import Sidebar from "@/components/layout/Sidebar";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/layout/SidebarProvider";

function AdminShell({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar/>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>

      {isOpen && (
        <div
          onClick={toggle}
          className="fixed inset-0 bg-black opacity-50 z-20 lg:hidden"
        />
      )}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminShell>{children}</AdminShell>
    </SidebarProvider>
  );
}

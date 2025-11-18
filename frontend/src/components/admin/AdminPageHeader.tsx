"use client";

import { ReactNode } from "react";
import { useSidebar } from "@/components/layout/SidebarProvider";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  rightContent?: ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  rightContent,
}: AdminPageHeaderProps) {
  const { toggle } = useSidebar();

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="lg:hidden text-gray-800 hover:text-gray-600 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-7 h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        {rightContent}
      </div>
    </div>
  );
}

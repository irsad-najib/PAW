"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ArrowLeftStartOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSidebar } from "./SidebarProvider";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Utama", icon: HomeIcon },
  { href: "/admin/menu", label: "Manajemen Menu", icon: BookOpenIcon },
  {
    href: "/admin/orders",
    label: "Daftar Pesanan",
    icon: ClipboardDocumentListIcon,
  },
  { href: "/admin/holidays", label: "Pembatalan Pesanan", icon: CalendarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebar();
  const { logout } = useAuth();

  const handleLinkClick = () => {
    if (isOpen) {
      close();
    }
  };

  const handleLogout = () => {
    logout();
    close();
  };

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-30
        w-72 bg-gray-800 text-white p-6
        flex flex-col shadow-xl overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:static lg:translate-x-0 lg:flex-shrink-0
      `}
    >
      <div className="relative mb-4">
        <div className="flex justify-center w-full">
          <Image
            src="/LogoAdmin.png"
            alt="Logo Katering Bu Lala"
            width={150}
            height={100}
            className="rounded-md"
          />
        </div>
        <span className="text-center block w-full text-lg font-semibold text-beige">
          Dashboard Admin
        </span>

        <button
          onClick={toggle}
          className="lg:hidden text-gray-400 hover:text-white absolute -top-2 -right-2 p-2"
          aria-label="Tutup menu"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <nav className="space-y-3 flex-grow">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              href={link.href}
              key={link.label}
              onClick={handleLinkClick}
              className={`
                flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700
                ${isActive ? "bg-gray-700 font-semibold" : ""}
              `}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-4 border-top border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-left p-3 rounded-lg hover:bg-gray-700 transition duration-150 flex items-center space-x-3">
          <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

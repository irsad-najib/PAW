"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-[#EDE4CC] shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Image
                  src="/logo2.png"
                  alt="Bu Lala Katering Logo"
                  width={50}
                  height={50}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-[#1F2937] group-hover:text-[#38A169] transition-colors duration-300">
                  Bu Lala Katering
                </h1>
                <p className="text-xs text-[#6B7280]">Cita Rasa Autentik</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation*/}
          <div className="hidden md:block">
            {/* Intentionally empty */}
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="group bg-[#38A169] hover:bg-[#2F855A] text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-[#1F2937] hover:bg-[#38A169] hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#38A169]"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        isMenuOpen 
          ? 'max-h-96 opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-[#EDE4CC] shadow-lg border-t border-[#D1D5DB]">
          
          {/* Mobile Brand Info */}
          <div className="px-3 py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">Bu Lala Katering</h2>
                <p className="text-sm text-[#6B7280]">Cita Rasa Autentik</p>
              </div>
            </div>
          </div>

          {/* Mobile Login Button */}
          <div className="px-3 pt-4 pb-2">
            <Link
              href="/login"
              onClick={closeMenu}
              className="w-full bg-[#38A169] hover:bg-[#2F855A] text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

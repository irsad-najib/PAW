"use client";
import Image from "next/image";

const Navbar = () => {
  return (
    <nav className="bg-[#EDE4CC] shadow-md">
      <div className="mx-auto px-4">
        <div className="flex justify-between h-16 items-center md:mx-20">
          <Image
            src="/logo2.png"
            alt="Logo"
            width={50}
            height={50}
            className="my-auto"
          />

          <div
            className="flex bg-[#38A169] text-white px-4 py-2 rounded-full my-auto"
            onClick={() => {
              window.location.href = "/login";
            }}>
            Login
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React from "react";
import Navbar from "../component/utils/navbar";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="justify-center bg-[#F7F7F7] text-black">
        <Image
          src="/home-bg.png"
          alt="Home Illustration"
          width={10000}
          height={400}
        />
        <div>dmaslkdnaljn {"\n"} sadlknsalnj</div>
      </div>
    </>
  );
}

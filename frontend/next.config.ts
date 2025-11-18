import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Next.js Image to load external images from Cloudinary (and others if needed)
  images: {
    domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;

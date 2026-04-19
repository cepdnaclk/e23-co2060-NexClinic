import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // turbopack: {
  //   root: __dirname,
  // },

  allowedDevOrigins: ['192.168.1.*'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "127.0.1.1",
    "127.0.1.1:3000",
    "192.168.1.141",
    "192.168.1.141:3000",
  ],
};

export default nextConfig;
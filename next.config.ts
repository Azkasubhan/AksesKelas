import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.40.168:3000",
    "192.168.40.168",
    "192.168.10.100:3000",
    "192.168.10.100",
  ],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-libsql', '@libsql/client', 'better-sqlite3'],
};

export default nextConfig;

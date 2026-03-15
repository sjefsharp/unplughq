import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["argon2", "ssh2", "bullmq", "pino"],
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@eduai365/ui'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

export default nextConfig;

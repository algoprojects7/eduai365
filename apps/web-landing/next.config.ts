import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@eduai365/ui', '@eduai365/shared-types'],
  devIndicators: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce HMR instability with heavy 3D client bundles
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  transpilePackages: [
    '@repo/shared-types',
    '@repo/ui',
    '@repo/event-bus',
    '@repo/streaming'
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_AI_SERVICE_URL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
    NEXT_PUBLIC_STREAMING_WS_URL: process.env.NEXT_PUBLIC_STREAMING_WS_URL || 'ws://localhost:8080',
    NEXT_PUBLIC_NESTJS_API_URL: process.env.NEXT_PUBLIC_NESTJS_API_URL || 'http://localhost:3001',
  }
};

module.exports = nextConfig;

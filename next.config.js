const withAnalyzer = require('@next/bundle-analyzer');
const { withContentlayer } = require('next-contentlayer');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
      timeout: 120000, // 2 minutes timeout for server actions
    },
  },
  images: {
    remotePatterns: getRemotePatterns(),
  },
  webpack: (config, { isServer }) => {
    // Add webpack configuration for Zoom SDK and email services
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        stream: false,
        path: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
      };
    }
    return config;
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless', // Changed from 'require-corp' to allow Supabase storage images
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

// Compose the configuration with analyzer and contentlayer
const composedConfig = withAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(withContentlayer(nextConfig));

module.exports = composedConfig;

function getRemotePatterns() {
  // add here the remote patterns for your images
  const remotePatterns = [];

  // Extract hostname from Supabase URL
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
      remotePatterns.push({
        protocol: 'https',
        hostname: url.hostname,
        pathname: '/storage/v1/object/public/**',
      });
    } catch (error) {
      console.warn(
        'Invalid NEXT_PUBLIC_SUPABASE_URL:',
        process.env.NEXT_PUBLIC_SUPABASE_URL,
      );
    }
  }

  return IS_PRODUCTION
    ? remotePatterns
    : [
        {
          protocol: 'http',
          hostname: '127.0.0.1',
        },
        ...remotePatterns,
      ];
}

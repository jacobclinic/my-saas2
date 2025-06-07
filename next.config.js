const withAnalyzer = require('@next/bundle-analyzer');
const { withContentlayer } = require('next-contentlayer');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: getRemotePatterns(),
  },
  webpack: (config, { isServer }) => {
    // Add webpack configuration for Zoom SDK
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
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
            value: 'require-corp',
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
  const remotePatterns = [
    {
      protocol: 'https',
      hostname: process.env.NEXT_PUBLIC_SUPABASE_URL,
      pathname: '/storage/v1/object/public/**',
    },
  ];

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

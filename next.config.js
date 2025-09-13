const withAnalyzer = require('@next/bundle-analyzer');
const { withContentlayer } = require('next-contentlayer');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
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


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "comma-education",
    project: "comma-edu",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['bcryptjs'],
  // Ensure environment variables are available during build
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Experimental features
  experimental: {
    // Note: esmExternals is not recommended but needed for compatibility
    // with certain packages
  },
  // Webpack configuration to handle Socket.io
  webpack: (config, { isServer }) => {
    // For client-side, provide empty implementations of Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        path: false,
        dns: false,
        child_process: false,
        http2: false,
        tty: false,
        'supports-color': false,
        dgram: false,
        'node:fs': false,
        'node:net': false,
        'node:path': false,
        'node:dns': false,
        'node:http': false,
        'node:https': false,
        'node:zlib': false,
        'node:stream': false,
        'node:buffer': false,
        'node:util': false,
        'node:url': false,
        'node:crypto': false,
        'node:events': false,
        'node:os': false,
        'node:tty': false,
        'node:child_process': false,
        'node:http2': false,
        'node:dgram': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

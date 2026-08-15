/** @type {import('next').NextConfig} */
const apiProxyTarget = process.env.API_PROXY_TARGET;

const nextConfig = {
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  transpilePackages: ['@kevincarmen/config', '@kevincarmen/types', '@kevincarmen/utils'],
  async rewrites() {
    return apiProxyTarget
      ? [{ source: '/api/:path*', destination: `${apiProxyTarget}/api/:path*` }]
      : [];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

module.exports = nextConfig;

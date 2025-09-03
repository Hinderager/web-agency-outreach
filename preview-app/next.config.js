/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/prospects/:path*',
        destination: '/prospects/:path*',
      },
    ]
  }
}

module.exports = nextConfig

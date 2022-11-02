/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/email',
        destination: '/api/email',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

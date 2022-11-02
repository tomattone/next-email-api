/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/api/email',
        permanent: true,
      },
      {
        source: '/email',
        destination: '/api/email',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: 'https://api.agenciaade.com.br/api/email',
        permanent: true,
      },
      {
        source: '/email',
        destination: 'https://api.agenciaade.com.br/api/email',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

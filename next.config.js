/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'], // Allow images from Firebase Storage
  },
  experimental: {
    serverActions: true,
  },
  // Increase static page generation timeout
  staticPageGenerationTimeout: 120,
  // Disable static generation for admin dashboard pages
  async generateStaticParams() {
    return {
      exclude: [
        '/admin-dashboard/**',
        '/trucker-dashboard/**',
        '/landowner-dashboard/**'
      ]
    }
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        worker_threads: false
      }
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname + '/src'
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  }
}

module.exports = nextConfig
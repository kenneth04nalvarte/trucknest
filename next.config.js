/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint during builds
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'], // Allow images from Firebase Storage
  },
  
  // Increase static page generation timeout
  staticPageGenerationTimeout: 180, // Increased timeout for larger pages
  
  // Configure static generation
  output: 'standalone',
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Configure which pages should be statically generated
  experimental: {
    // Enable static optimization for all pages except admin routes
    optimizeCss: true,
    optimizeImages: true,
    optimizeFonts: true,
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
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'https://trucknest-4q7hwykws-kenneths-projects-b5a1aa89.vercel.app' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  }
}

module.exports = nextConfig

import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  reactCompiler: true,
  images: {
    // Add domains if you load external images
    remotePatterns: [
      { protocol: 'https', hostname: 'minio.aiwata.cloud' },
      { protocol: 'https', hostname: 'via.placeholder.com' }
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      // Basic CSP for dev; loosen as needed for analytics, fonts, etc.
      // In dev we avoid strict CSP to reduce friction
    ]

    const publicBotHeaders = [
      // Allow public bots to be embedded in iframes from any origin
      { key: 'X-Frame-Options', value: 'ALLOWALL' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      // Restrict script sources to prevent unauthorized scripts
      {
        key: 'Content-Security-Policy',
        value: "script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none'; frame-ancestors *;"
      },
    ]

    return [
      {
        source: '/public/bots/:path*',
        headers: publicBotHeaders,
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query'],
  },
  output: 'standalone',
}

const analyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);

export default analyzerConfig;

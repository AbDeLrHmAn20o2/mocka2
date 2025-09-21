/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    domains: ["res.cloudinary.com", "cloudinary.com"],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,

  // Bundle analysis
  bundlePagesRouterDependencies: true,

  // Experimental features for performance
  experimental: {
    optimizeCss: process.env.NODE_ENV === "production",
    scrollRestoration: true,
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: ["cloudinary"],

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }

    // Development optimizations
    if (dev && !isServer) {
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/.git/**",
          "**/coverage/**",
          "**/public/**",
        ],
      };
    }

    return config;
  },

  // Output configuration for deployment
  output: "standalone",

  // Redirect configuration
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: false,
      },
      {
        source: "/ar",
        destination: "/",
        permanent: false,
      },
      {
        source: "/es",
        destination: "/",
        permanent: false,
      },
      {
        source: "/fr",
        destination: "/",
        permanent: false,
      },
      {
        source: "/de",
        destination: "/",
        permanent: false,
      },
      {
        source: "/zh",
        destination: "/",
        permanent: false,
      },
    ];
  },

  // Webpack configuration to prevent SSR issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude fabric.js from server-side bundle
      config.externals = config.externals || [];
      config.externals.push("fabric");

      // Add fallback for missing modules in server environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fabric: false,
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;

export default {
    reactStrictMode: true,
    env: {
      MONGODB_URI: process.env.DATABASE_URL,
      // Other environment variables
    },
    async rewrites() {
      return [
        {
          source: '/uploads/:path*',
          destination: '/public/uploads/:path*',
        },
      ];
    },
  };
  
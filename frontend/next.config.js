import dotenv from "dotenv";
dotenv.config();
const apiUrl = process.env.API_BASE_URL || "https://api.apartner.site";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        source: `/api/:path*`,
        // destination: process.env.NEXT_PUBLIC_API_BASE_URL + "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/stomp/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  // env: {
  //   NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_URL
  // },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Ant Design을 위한 React 19 호환성 설정 추가
  webpack: (config) => {
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  // React 19 호환성 이슈로 인한 Ant Design 경고 무시 설정
  reactStrictMode: false,
};

export default nextConfig;

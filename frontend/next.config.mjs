/** @type {import('next').NextConfig} */
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
  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: '10mb', // 10MB로 제한 늘리기
  //   },
  // },
  experimental: {
    optimizeCss: true,
    appDir: true,
    scrollRestoration: true,
    serverActions: true,
  },
};

export default nextConfig;

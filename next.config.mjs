/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  eslint: {
    dirs: ['src'],
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;

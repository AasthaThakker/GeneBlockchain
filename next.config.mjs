/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'mongoose': 'commonjs mongoose'
      });
    }
    return config;
  },
}

export default nextConfig

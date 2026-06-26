/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',   // required for the Docker multi-stage build
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

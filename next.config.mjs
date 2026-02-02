/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use legacy single .next folder to avoid routes-manifest.json ENOENT in .next/dev
  isolatedDevBuild: false,
};

export default nextConfig;

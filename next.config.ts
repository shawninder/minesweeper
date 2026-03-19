import type { NextConfig } from "next";

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: isProd && repo ? `/${repo}` : '',
  assetPrefix: isProd && repo ? `/${repo}/` : ''
};

export default nextConfig;

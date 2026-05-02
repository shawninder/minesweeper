import type { NextConfig } from "next";
import { ip } from "address"

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isProd = process.env.NODE_ENV === 'production'
const localIp = ip()
console.log({localIp})
const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: isProd && repo ? `/${repo}` : '',
  assetPrefix: isProd && repo ? `/${repo}/` : '',
  allowedDevOrigins: [`${localIp}`, `${localIp}:3000`]
};

export default nextConfig;

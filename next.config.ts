import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Keep serverless traces small on Netlify (APK + native projects are static-only).
  outputFileTracingExcludes: {
    "*": [
      "public/downloads/**",
      "android/**",
      "ios/**",
      "node_modules/@swc/core-linux-x64-gnu/**",
      "node_modules/@swc/core-linux-x64-musl/**",
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);

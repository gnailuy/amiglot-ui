import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: process.env.NEXT_ALLOWED_DEV_ORIGINS
      ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(",")
      : [],
  },
};

export default withNextIntl(nextConfig);

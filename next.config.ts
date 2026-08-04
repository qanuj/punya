import type { NextConfig } from "next";

/**
 * Pictures come from the CMS's media host, which is wherever TINTORCH_CMS_URL
 * points its uploads. Read from the environment so a fork pointed at a
 * different CMS does not have to edit this file.
 */
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST ?? "media.tintorch.com";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: mediaHost }],
  },
};

export default nextConfig;

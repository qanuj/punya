import type { NextConfig } from "next";

/**
 * Pictures come from the CMS's media host, which is wherever TINTORCH_CMS_URL
 * points its uploads. Read from the environment so a fork pointed at a
 * different CMS does not have to edit this file.
 */
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST ?? "media.tintorch.com";

const nextConfig: NextConfig = {
  /*
   * The shared package ships .tsx rather than compiled output, so Next builds
   * it with the app - no build step in the package, and the "use client"
   * boundary stays where it was written.
   */
  transpilePackages: ["@tintorch/web"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: mediaHost }],
  },
};

export default nextConfig;

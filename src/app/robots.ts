import type { MetadataRoute } from "next";
import { getSite } from "@/lib/cms";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();
  const base = (site.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");

  return {
    rules: { userAgent: "*", allow: "/" },
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}

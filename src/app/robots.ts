import { robotsRules } from "@tintorch/web";
import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/sitemap-sources";

/**
 * AI crawlers are allowed: this site publishes an llms.txt precisely so they
 * read it. The sitemap link is the only reliable way a crawler that was never
 * handed one finds it.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  return robotsRules({ siteUrl: await siteOrigin() });
}

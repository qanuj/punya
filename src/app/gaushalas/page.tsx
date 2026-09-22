import type { Metadata } from "next";
import { SectionIndex, indexMetadata, indexRoute } from "@/components/section-index";

/**
 * /gaushalas - a route of its own rather than a shape the catch-all recognises.
 *
 * The listing and anything the CMS has written for this URL are both in
 * SectionIndex; this file exists so the index is a page in the app rather than
 * one of the things one dynamic route happens to resolve to.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return indexMetadata("gaushalas");
}

export default async function Page() {
  const { type } = await indexRoute("gaushalas");
  return <SectionIndex type={type} />;
}

import { NextResponse } from "next/server";
import { orderStatus } from "@/lib/checkout";

export const dynamic = "force-dynamic";

/**
 * What actually happened to a payment.
 *
 * The page polls this rather than believing the gateway's own modal: the
 * browser is the one participant with a reason to lie, and the only one that
 * can be closed halfway through.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await orderStatus(id);

  if ("error" in result) {
    return NextResponse.json({ error: { message: result.error } }, { status: result.status });
  }
  return NextResponse.json({ data: result });
}

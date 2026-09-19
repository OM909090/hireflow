import { NextResponse } from "next/server";

import { llmConfig } from "@/lib/llm";

/**
 * Is model access configured for the agent?
 *
 * Deliberately does not run a completion — a real call on this endpoint costs
 * seconds, and the panel should not pay that on mount. It reports whether the
 * agent has a model and endpoint to talk to; the first real call confirms it.
 */
export async function GET() {
  try {
    const cfg = llmConfig();
    return NextResponse.json({
      configured: true,
      model: cfg.model,
      endpoint: cfg.baseUrl,
    });
  } catch (e) {
    return NextResponse.json({
      configured: false,
      model: null,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

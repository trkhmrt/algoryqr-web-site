import { NextResponse } from "next/server";
import { z } from "zod";

import { getChefChatBadgesForMenu } from "@/lib/chef/chef-chat-badges";

const querySchema = z.object({
  publicId: z.string().trim().min(1).max(128),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    publicId: url.searchParams.get("publicId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  return NextResponse.json({
    badges: getChefChatBadgesForMenu(parsed.data.publicId),
  });
}

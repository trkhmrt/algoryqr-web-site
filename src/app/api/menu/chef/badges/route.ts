import { NextResponse } from "next/server";
import { z } from "zod";

import { getChefChatBadgesForMenu } from "@/lib/chef/chef-chat-badges";

const querySchema = z.object({
  menuId: z.coerce.number().int().positive(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    menuId: url.searchParams.get("menuId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  return NextResponse.json({
    badges: getChefChatBadgesForMenu(parsed.data.menuId),
  });
}

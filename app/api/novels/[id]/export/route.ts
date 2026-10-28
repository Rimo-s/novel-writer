import { apiUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { exportText } from "@/lib/document";
import { novelStore } from "@/lib/novels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ownerId = await apiUser();
    const novel = await novelStore(prisma).get(ownerId, (await params).id);
    return new Response(exportText(novel), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="novel.txt"; filename*=UTF-8''${encodeURIComponent(novel.title).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`)}.txt`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

import { apiUser } from "@/lib/auth";
import { readBody, errorResponse } from "@/lib/http";
import { novelStore } from "@/lib/novels";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const ownerId = await apiUser();
    const novel = await novelStore(prisma).create(
      ownerId,
      await readBody(request),
    );
    return Response.json({ id: novel.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

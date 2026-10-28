import { apiUser } from "@/lib/auth";
import { readBody, errorResponse } from "@/lib/http";
import { novelStore } from "@/lib/novels";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const ownerId = await apiUser();
    const chapter = await novelStore(prisma).addChapter(
      ownerId,
      await readBody(request),
    );
    return Response.json(chapter, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ownerId = await apiUser();
    return Response.json(
      await novelStore(prisma).saveChapter(ownerId, await readBody(request)),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

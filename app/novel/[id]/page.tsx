import { notFound } from "next/navigation";
import { pageUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { novelStore } from "@/lib/novels";
import { prisma } from "@/lib/prisma";
import type { JSONContent } from "@tiptap/core";
import NovelClient from "./NovelClient";

export const dynamic = "force-dynamic";

export default async function NovelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ownerId = await pageUser();
  const novel = await novelStore(prisma)
    .get(ownerId, (await params).id)
    .catch((error: unknown) => {
      if (
        error instanceof AppError &&
        (error.status === 404 || error.status === 400)
      )
        notFound();
      throw error;
    });
  return (
    <NovelClient
      ownerId={ownerId}
      aiEnabled={Boolean(
        process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL,
      )}
      novel={{
        id: novel.id,
        title: novel.title,
        chapters: novel.chapters.map(({ id, title, content, version }) => ({
          id,
          title,
          content: content as JSONContent,
          version,
        })),
      }}
    />
  );
}

import type { PrismaClient, Prisma } from "@prisma/client";
import {
  EMPTY_DOCUMENT,
  documentData,
  identifier,
  textField,
} from "./document";
import { AppError } from "./errors";

// Every data operation accepts a server-derived Clerk ID, never a request userId.
export function novelStore(db: PrismaClient) {
  return {
    list(ownerId: string) {
      return db.novel.findMany({
        where: { ownerId },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { chapters: true } } },
      });
    },
    async get(ownerId: string, id: string) {
      const novel = await db.novel.findFirst({
        where: { id: identifier(id), ownerId },
        include: {
          chapters: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
        },
      });
      if (!novel) throw new AppError(404, "Schreibprojekt nicht gefunden.");
      return novel;
    },
    create(ownerId: string, input: Record<string, unknown>) {
      return db.novel.create({
        data: {
          ownerId,
          title: textField(input.title, "Titel", 120),
          description: textField(
            input.description ?? "",
            "Kurzbeschreibung",
            1000,
            true,
          ),
          chapters: {
            create: {
              title: "Kapitel 1",
              content: EMPTY_DOCUMENT as Prisma.InputJsonValue,
            },
          },
        },
      });
    },
    async addChapter(ownerId: string, input: Record<string, unknown>) {
      const novelId = identifier(input.novelId);
      const title = textField(input.title, "Kapiteltitel", 120);
      return db.$transaction(async (tx) => {
        const novel = await tx.novel.findFirst({
          where: { id: novelId, ownerId },
          select: { id: true },
        });
        if (!novel) throw new AppError(404, "Schreibprojekt nicht gefunden.");
        const chapter = await tx.chapter.create({
          data: {
            novelId,
            title,
            content: EMPTY_DOCUMENT as Prisma.InputJsonValue,
          },
        });
        await tx.novel.update({
          where: { id: novelId },
          data: { updatedAt: new Date() },
        });
        return chapter;
      });
    },
    async saveChapter(ownerId: string, input: Record<string, unknown>) {
      const id = identifier(input.id);
      const title = textField(input.title, "Kapiteltitel", 120);
      if (
        typeof input.version !== "number" ||
        !Number.isSafeInteger(input.version) ||
        input.version < 0 ||
        input.version > 2_000_000_000
      ) {
        throw new AppError(400, "Ungültige Speicherversion.");
      }
      const version = input.version;
      const { content, plainText } = documentData(input.content);
      return db.$transaction(async (tx) => {
        const chapter = await tx.chapter.findFirst({
          where: { id, novel: { ownerId } },
          select: { novelId: true },
        });
        if (!chapter) throw new AppError(404, "Kapitel nicht gefunden.");
        // Atomic compare-and-swap: only one writer can advance this version.
        const result = await tx.chapter.updateMany({
          where: { id, version, novel: { ownerId } },
          data: {
            title,
            content: content as Prisma.InputJsonValue,
            plainText,
            version: { increment: 1 },
          },
        });
        if (result.count !== 1)
          throw new AppError(
            409,
            "Dieses Kapitel wurde in einem anderen Tab geändert. Sichere deinen Entwurf und lade die Seite neu.",
          );
        await tx.novel.update({
          where: { id: chapter.novelId },
          data: { updatedAt: new Date() },
        });
        return { version: version + 1 };
      });
    },
    async consumeAiAttempt(
      ownerId: string,
      day = new Date().toISOString().slice(0, 10),
    ) {
      return db.$transaction(async (tx) => {
        await tx.aiUsage.upsert({
          where: { ownerId_day: { ownerId, day } },
          create: { ownerId, day },
          update: { count: { increment: 0 } },
        });
        const reserved = await tx.aiUsage.updateMany({
          where: { ownerId, day, count: { lt: 10 } },
          data: { count: { increment: 1 } },
        });
        if (!reserved.count)
          throw new AppError(
            429,
            "Das Tageslimit von 10 KI-Versuchen ist erreicht (Reset um 00:00 UTC).",
          );
      });
    },
  };
}

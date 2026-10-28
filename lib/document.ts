import { getSchema, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { AppError } from "./errors";

export const EMPTY_DOCUMENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
const schema = getSchema([StarterKit]);

export function textField(
  value: unknown,
  name: string,
  max: number,
  allowEmpty = false,
) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!allowEmpty && !value.trim())
  ) {
    throw new AppError(
      400,
      `${name}: Bitte ${allowEmpty ? "höchstens" : "1 bis"} ${max} Zeichen eingeben.`,
    );
  }
  return value.trim();
}

export function identifier(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    throw new AppError(400, "Ungültige ID.");
  }
  return value;
}

export function documentData(value: unknown): {
  content: JSONContent;
  plainText: string;
} {
  const invalid = () =>
    new AppError(400, "Ungültiger oder zu großer Editorinhalt (max. 250 KB).");
  if (
    !value ||
    typeof value !== "object" ||
    new TextEncoder().encode(JSON.stringify(value)).byteLength > 250_000
  )
    throw invalid();
  let nodes = 0;
  function depthCheck(item: unknown, depth: number) {
    if (depth > 32 || ++nodes > 30_000) throw invalid();
    if (item && typeof item === "object") {
      for (const child of Object.values(item)) depthCheck(child, depth + 1);
    }
  }
  depthCheck(value, 0);
  try {
    const node = schema.nodeFromJSON(value);
    if (node.type !== schema.topNodeType) throw invalid();
    node.check();
    node.descendants((child) => {
      for (const mark of child.marks) {
        if (
          mark.type.name === "link" &&
          !/^(https?:\/\/|mailto:)/i.test(String(mark.attrs.href))
        )
          throw invalid();
      }
    });
    return {
      content: node.toJSON(),
      plainText: node.textBetween(0, node.content.size, "\n", "\n"),
    };
  } catch {
    throw invalid();
  }
}

export function exportText(novel: {
  title: string;
  description: string;
  chapters: { title: string; plainText: string }[];
}) {
  return [
    novel.title,
    novel.description,
    ...novel.chapters.flatMap((chapter) => [chapter.title, chapter.plainText]),
  ]
    .filter(Boolean)
    .join("\n\n");
}

import type { JSONContent } from "@tiptap/core";

export type ChapterView = {
  id: string;
  title: string;
  content: JSONContent;
  version: number;
};

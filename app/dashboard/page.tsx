import Library from "@/components/Library";
import { pageUser } from "@/lib/auth";
import { novelStore } from "@/lib/novels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const novels = await novelStore(prisma).list(await pageUser());
  return <Library novels={novels} />;
}

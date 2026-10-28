import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppError } from "./errors";

export function authConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
}

export async function apiUser() {
  if (!authConfigured() || !process.env.DATABASE_URL)
    throw new AppError(503, "Die Anwendung ist noch nicht eingerichtet.");
  const { userId } = await auth();
  if (!userId) throw new AppError(401, "Bitte melde dich erneut an.");
  return userId;
}

export async function pageUser() {
  if (!authConfigured() || !process.env.DATABASE_URL) redirect("/setup");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

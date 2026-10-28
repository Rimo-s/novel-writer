import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { authConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default function SignInPage() {
  if (!authConfigured()) redirect("/setup");
  return (
    <main className="auth-page">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}

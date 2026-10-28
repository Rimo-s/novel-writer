import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { authConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default function SignUpPage() {
  if (!authConfigured()) redirect("/setup");
  return (
    <main className="auth-page">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}

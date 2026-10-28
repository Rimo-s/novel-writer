import type { Metadata } from "next";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Novel Writer — Raum für deine Geschichten",
    template: "%s · Novel Writer",
  },
  description:
    "Schreibe Romane im Browser, organisiere Kapitel und entwickle deine Geschichte mit optionaler KI-Unterstützung weiter.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
  const shell = (
    <html lang="de">
      <body>
        <a className="skip-link" href="#main-content">
          Zum Inhalt
        </a>
        <header className="site-header">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              N
            </span>
            Novel Writer<span className="beta">Beta</span>
          </Link>
          <nav aria-label="Hauptnavigation">
            <Link href={configured ? "/dashboard" : "/setup"}>
              Schreibbereich
            </Link>
            {configured && <UserButton />}
          </nav>
        </header>
        <div id="main-content">{children}</div>
        <footer className="site-footer">
          <span>Novel Writer</span>
          <span>Eine Seite nach der anderen.</span>
        </footer>
      </body>
    </html>
  );
  return configured ? (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      {shell}
    </ClerkProvider>
  ) : (
    shell
  );
}

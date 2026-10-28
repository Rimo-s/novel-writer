import type { ReactNode } from "react";

const paths = {
  arrow: (
    <>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </>
  ),
  back: (
    <>
      <path d="M19 12H5m6-6-6 6 6 6" />
    </>
  ),
  down: <path d="m6 9 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  book: (
    <>
      <path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-3-2H4V4Zm16 0h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 3-2h4V4Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" />
    </>
  ),
  save: (
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z" />
      <path d="M7 3v6h10V3M7 21v-8h10v8" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3ZM20 2v4m-2-2h4" />
    </>
  ),
  bold: (
    <>
      <path d="M7 4h6a4 4 0 0 1 0 8H7V4Zm0 8h7a4 4 0 0 1 0 8H7v-8Z" />
    </>
  ),
  italic: <path d="M10 4h10M4 20h10M15 4 9 20" />,
  heading: <path d="M5 4v16M17 4v16M5 12h12m3 5v3" />,
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="3" />
    </>
  ),
  undo: (
    <>
      <path d="m8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12h-3" />
    </>
  ),
  redo: (
    <>
      <path d="m16 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12h3" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  loader: <path d="M20 12a8 8 0 1 1-8-8" />,
} satisfies Record<string, ReactNode>;

export default function Icon({
  name,
  className = "",
}: {
  name: keyof typeof paths;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

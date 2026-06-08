import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse Society — Join Us",
  description: "A community driven by peer-to-peer learning, knowledge sharing, and building the future.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="terminal-decoration">
          SYSTEM_INIT: OK<br />
          MEM_ALLOC: 4096KB<br />
          PROTOCOL: SECURE<br />
          AWAITING_INPUT...
        </div>
        <div className="terminal-decoration-right">
          LATENCY: 12ms<br />
          ROOT_ACCESS: DENIED<br />
          USER_ID: ANONYMOUS
        </div>
        <div className="scanlines"></div>
        <div className="vignette"></div>
        {children}
      </body>
    </html>
  );
}

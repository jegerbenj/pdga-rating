import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDGA Rating-kalkulator",
  description: "Beregn din PDGA-rating fra ratede runder basert på PDGA-regler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" className="h-full antialiased">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/kkm8dxd.css" />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-body">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IMMO OFFICE",
  description: "Die zentrale Immobilienplattform für Ihr Team."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import NavBar from "./NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "Obrix",
  description:
    "Obrix: describí tu proyecto, calculá materiales, compará comercios y hacé tu pedido.",
  applicationName: "Obrix",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Obrix",
    description:
      "Describí tu proyecto, calculá materiales, compará comercios y hacé tu pedido.",
    siteName: "Obrix",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Obrix",
    description:
      "Describí tu proyecto, calculá materiales, compará comercios y hacé tu pedido.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <NavBar />
          <div className="flex flex-1 flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

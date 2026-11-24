import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RuangPintar | Platform Kursus Daring Interaktif",
  description:
    "Platform pembelajaran daring yang bersih, fokus, dan terstruktur dengan Next.js dan PostgreSQL.",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-950">
        <Navbar user={user} />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

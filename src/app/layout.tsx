import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import DemoDateBar from "@/components/DemoDateBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "구독 습관 진단기",
  description:
    "구독 이용 기록을 남기면 1회당 실제 비용을 계산해 해지할 구독과 대체 서비스를 골라 줍니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DemoDateBar />
        {children}
      </body>
    </html>
  );
}

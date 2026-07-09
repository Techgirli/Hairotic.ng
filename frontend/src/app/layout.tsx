import type { Metadata } from "next";
import { Rubik_Spray_Paint, Outfit } from "next/font/google";
import "./globals.css";
import CartDrawer from "../components/cart-drawer";

const rubikSprayPaint = Rubik_Spray_Paint({
  variable: "--font-rubik-spray",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hairotic.ng | Premium Nigerian Hair Store",
  description: "Empower your boldest self with premium, high-quality wigs and hair bundles. Shopped like a fashion drop.",
  keywords: ["premium hair", "human hair wigs", "Nigerian hair store", "Lagos hair", "bundles", "closures", "frontals"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rubikSprayPaint.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FFFFFF] text-[#222222]">
        {children}
        <CartDrawer />
      </body>
    </html>
  );
}

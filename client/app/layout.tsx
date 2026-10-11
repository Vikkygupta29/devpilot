import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/components/providers/query-provider";


const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DevPilot - AI-Powered Codebase Intelligence",
  description: "Connect GitHub, index any repository, and chat with your codebase using AI-driven code intelligence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", roboto.variable, poppins.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" cz-shortcut-listen="true">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}


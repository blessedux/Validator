import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { FooterProvider } from "@/components/ui/footer-context";
import {
  Shield,
  BarChart2,
  User,
  Settings,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DOB Validator BackOffice",
  description:
    "CMS-Integrated BackOffice Dashboard for DOB Protocol validation",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16" },
      { url: "/favicon-32x32.png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="js-ready">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Ensure content is always visible
              document.documentElement.classList.add('js-ready');
              document.body && document.body.classList.add('js-ready');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FooterProvider>
            <div className="min-h-screen flex flex-col">
              <main className="flex-1 flex flex-col" id="main-content">
                {children}
              </main>
            </div>
          </FooterProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

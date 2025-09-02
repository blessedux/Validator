import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { FooterProvider } from "@/components/ui/footer-context";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  User,
  Settings,
} from "lucide-react";
import PageTransition from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} relative min-h-screen`}>
      <div className="relative z-10">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FooterProvider>
            <SidebarProvider>
              <Sidebar>
                <SidebarContent>
                  <SidebarMenu>
                    <li>
                      <a
                        href="/dashboard"
                        className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded text-foreground"
                      >
                        <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                        <span className="hidden group-data-[state=expanded]:inline text-foreground">
                          Dashboard
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="/submission-review"
                        className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded text-foreground"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="hidden group-data-[state=expanded]:inline text-foreground">
                          Submission Review
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="/analytics"
                        className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded text-foreground"
                      >
                        <BarChart2 className="h-5 w-5 text-muted-foreground" />
                        <span className="hidden group-data-[state=expanded]:inline text-foreground">
                          Analytics
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="/profile"
                        className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded text-foreground"
                      >
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="hidden group-data-[state=expanded]:inline text-foreground">
                          Profile
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="/settings"
                        className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded text-foreground"
                      >
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <span className="hidden group-data-[state=expanded]:inline text-foreground">
                          Settings
                        </span>
                      </a>
                    </li>
                  </SidebarMenu>
                </SidebarContent>
              </Sidebar>
              <div className="min-h-screen flex flex-col">
                <main className="flex-1 flex flex-col" id="main-content">
                  <PageTransition>{children}</PageTransition>
                </main>
              </div>
            </SidebarProvider>
          </FooterProvider>
          <Toaster />
        </ThemeProvider>
      </div>
    </div>
  );
}

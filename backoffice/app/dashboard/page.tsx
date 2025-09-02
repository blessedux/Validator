"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  LogOut,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  ExternalLink,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  apiService,
  type Submission,
  type SubmissionsStats,
} from "@/lib/api-service";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { FooterProvider } from "@/components/ui/footer-context";

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SubmissionsStats>({
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Sidebar expand/collapse control
  const [sidebarState, setSidebarState] = useState<"expanded" | "collapsed">(
    "collapsed",
  );

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem("authToken");
    const publicKey = localStorage.getItem("stellarPublicKey");

    if (!authToken || !publicKey) {
      router.push("/");
      return;
    }

    setIsAuthenticated(true);
    setWalletAddress(publicKey);
    setIsLoading(false);

    // Set up API service with auth token - parse JSON first!
    try {
      const parsedToken = JSON.parse(authToken);
      apiService.setAuthToken(parsedToken);
    } catch (error) {
      // If it's not JSON, assume it's a plain token
      apiService.setAuthToken(authToken);
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      console.log("🔄 Fetching dashboard data...");

      // Fetch stats and recent submissions in parallel
      const [statsData, submissionsData] = await Promise.all([
        apiService.getSubmissionsStats(),
        apiService.getAllSubmissions({ limit: 5 }),
      ]);

      console.log("✅ Stats fetched:", statsData);
      console.log(
        "✅ Submissions fetched:",
        submissionsData.submissions.length,
        "submissions",
      );

      setStats(statsData);
      setRecentSubmissions(submissionsData.submissions);

      toast({
        title: "Dashboard loaded",
        description: `Loaded ${submissionsData.submissions.length} recent submissions`,
      });
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to load dashboard data. Using fallback display.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("stellarPublicKey");
    localStorage.removeItem("stellarWallet");

    toast({
      title: "Logged out",
      description: "Successfully logged out from the dashboard",
    });

    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="/validatorLight.webp"
                alt="Validator Logo Light"
                className="h-10 w-auto max-h-12 object-contain dark:hidden"
              />
              <img
                src="/validatorDark.webp"
                alt="Validator Logo Dark"
                className="h-10 w-auto max-h-12 object-contain hidden dark:block"
              />
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-foreground"
                  >
                    <User className="h-4 w-4 mr-1" />
                    <span className="font-mono text-foreground">
                      {walletAddress
                        ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`
                        : "Unknown"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-foreground">
                    Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer text-foreground"
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (document.documentElement.classList.contains("dark")) {
                        document.documentElement.classList.remove("dark");
                        localStorage.setItem("theme", "light");
                      } else {
                        document.documentElement.classList.add("dark");
                        localStorage.setItem("theme", "dark");
                      }
                    }}
                    className="cursor-pointer text-foreground"
                  >
                    <span className="mr-2">🌓</span>
                    Toggle Theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 text-foreground">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">
              Dashboard Overview
            </h2>
            <Button
              onClick={fetchDashboardData}
              disabled={isLoadingData}
              variant="outline"
              className="text-foreground"
            >
              {isLoadingData ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Total
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoadingData ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.total
                  )}
                </div>
                <p className="text-xs text-muted-foreground">All submissions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoadingData ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.pending
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Under Review
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoadingData ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.underReview
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Being processed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Approved
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoadingData ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.approved
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully validated
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Rejected
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoadingData ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.rejected
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Did not pass validation
                </p>
              </CardContent>
            </Card>
          </div>
          {/* Recent Submissions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-foreground">
                Recent Submissions
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Latest device validation submissions from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-foreground">
                    Loading submissions...
                  </span>
                </div>
              ) : recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {submission.deviceName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {submission.deviceType} • {submission.manufacturer}{" "}
                          {submission.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {formatDate(submission.submittedAt)}
                          {submission.user?.walletAddress && (
                            <span className="ml-2 text-foreground">
                              by {submission.user.walletAddress.slice(0, 8)}
                              ...
                              {submission.user.walletAddress.slice(-4)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status.replace("_", " ")}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/submission-review?id=${submission.id}`,
                              "_blank",
                            )
                          }
                          className="text-foreground"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground">No submissions found</p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Device validation submissions will appear here once users
                    submit them
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">System Status</CardTitle>
              <CardDescription className="text-muted-foreground">
                Current system health and connection status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Wallet Connection
                </span>
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Authentication
                </span>
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Authenticated
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Backend API
                </span>
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Database
                </span>
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Network
                </span>
                <span className="text-sm text-foreground">Stellar Testnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Last Updated
                </span>
                <span className="text-sm text-muted-foreground">
                  {isLoadingData
                    ? "Updating..."
                    : formatDate(new Date().toISOString())}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

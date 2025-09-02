"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowRight,
  Loader2,
  AlertCircle,
  Shield,
  Menu,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { FreighterService } from "@/lib/freighter-service";
import { apiService } from "@/lib/api-service";
import { storeAuthToken } from "@/lib/auth";
import { adminConfigService } from "@/lib/admin-config";

export default function LandingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [freighterAvailable, setFreighterAvailable] = useState(false);
  const freighterService = new FreighterService();

  // Check Freighter availability on mount
  useEffect(() => {
    const checkFreighterAvailability = async () => {
      try {
        const available = await freighterService.isAvailable();
        console.log("🔍 Freighter availability check:", available);
        setFreighterAvailable(available);
      } catch (error) {
        console.error("❌ Error checking Freighter availability:", error);
        setFreighterAvailable(false);
      }
    };

    checkFreighterAvailability();
  }, []);

  // Check if already authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log("🔍 Starting authentication check...");

        if (typeof window === "undefined") {
          console.log("❌ Window is undefined, skipping check");
          return;
        }

        const authToken = localStorage.getItem("authToken");
        const publicKey = localStorage.getItem("stellarPublicKey");

        console.log(
          "🔍 Auth check - token:",
          !!authToken,
          "publicKey:",
          !!publicKey,
        );

        if (authToken && publicKey) {
          console.log("✅ Already authenticated, redirecting to dashboard");
          router.replace("/dashboard");
          return;
        }

        console.log("❌ No authentication found, showing login page");
        setHasCheckedAuth(true);
      } catch (error) {
        console.error("❌ Error checking authentication:", error);
        setHasCheckedAuth(true);
      }
    };

    // Run check immediately
    checkAuth();

    // Fallback timeout
    const timeout = setTimeout(() => {
      console.log("⏰ Auth check timeout, forcing login page display");
      setHasCheckedAuth(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [router]);

  const handleConnectWallet = async () => {
    if (!freighterAvailable) {
      toast({
        title: "Freighter Not Available",
        description:
          "Please install the Freighter extension and refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      console.log("🔗 Starting Freighter wallet connection...");

      // Step 1: Request access to Freighter wallet
      console.log("🔍 Requesting access to Freighter...");
      const accessGranted = await freighterService.requestAccess();
      if (!accessGranted) {
        throw new Error("Freighter access was denied by user");
      }
      console.log("✅ Freighter access granted");

      // Step 2: Get wallet address
      console.log("🔍 Getting wallet address...");
      const publicKey = await freighterService.getAddress();
      console.log("✅ Wallet address obtained:", publicKey);

      // Step 2.5: Check if wallet is admin BEFORE starting authentication
      console.log("🔍 Checking admin status...");
      if (!adminConfigService.isAdminWallet(publicKey)) {
        console.log("❌ Non-admin wallet detected");
        toast({
          title: "Access Denied",
          description:
            "This wallet is not authorized for admin access. Please contact support if you believe this is an error.",
          variant: "destructive",
        });
        return;
      }
      console.log("✅ Admin wallet verified");

      // Step 3: Store wallet info
      localStorage.setItem("stellarPublicKey", publicKey);
      localStorage.setItem("stellarWallet", "freighter");

      // Step 4: Request authentication challenge from backend
      console.log("🔍 Requesting authentication challenge...");
      const challengeResponse = await apiService.generateChallenge(publicKey);
      console.log("✅ Challenge received:", challengeResponse.challenge);

      // Step 5: Create and sign transaction (safe method)
      console.log("🔍 Creating challenge transaction...");
      const xdrTransaction = freighterService.createAuthChallengeTransaction(
        challengeResponse.challenge,
        publicKey,
      );

      console.log("🔍 Signing challenge transaction with Freighter...");
      const signature = await freighterService.signTransaction(xdrTransaction, {
        networkPassphrase: "Test SDF Network ; September 2015", // Testnet passphrase
        accountToSign: publicKey,
      });
      console.log("✅ Challenge signed:", signature.substring(0, 20) + "...");

      // Step 6: Verify signature with backend and get JWT token
      console.log("🔍 Verifying signature with backend...");
      const authResult = await apiService.verifySignature(
        publicKey,
        signature,
        challengeResponse.challenge,
      );
      console.log("✅ Authentication successful:", authResult);

      // Step 7: Store authentication token
      storeAuthToken(authResult.token, "7d", publicKey);

      toast({
        title: "Authentication successful",
        description: `Connected with wallet: ${publicKey.substring(0, 8)}...${publicKey.substring(-4)}`,
      });

      // Step 8: Redirect to dashboard
      console.log("✅ Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Wallet connection/authentication failed:", error);

      // Clear any partial state on error
      localStorage.removeItem("stellarPublicKey");
      localStorage.removeItem("stellarWallet");
      localStorage.removeItem("authToken");

      let errorMessage = "Failed to connect wallet";

      if (
        error.message?.includes("access denied") ||
        error.message?.includes("User declined access")
      ) {
        errorMessage =
          "Freighter access was denied. Please approve the connection request.";
      } else if (error.message?.includes("not installed")) {
        errorMessage =
          "Freighter extension not found. Please install Freighter wallet.";
      } else if (error.message?.includes("challenge")) {
        errorMessage =
          "Failed to generate authentication challenge. Please try again.";
      } else if (error.message?.includes("signature")) {
        errorMessage =
          "Failed to sign authentication challenge. Please try again.";
      } else if (error.message?.includes("verify")) {
        errorMessage = "Authentication verification failed. Please try again.";
      }

      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  console.log(
    "🔍 Render state - hasCheckedAuth:",
    hasCheckedAuth,
    "isConnecting:",
    isConnecting,
    "freighterAvailable:",
    freighterAvailable,
  );

  // Loading state with visible background
  if (!hasCheckedAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span style={{ color: "#333" }}>Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Main login page with inline styles for guaranteed visibility
  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#4f46e5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px auto",
              }}
            >
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: "8px",
              }}
            >
              DOB Validator BackOffice
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Connect your Freighter wallet to access the admin dashboard
            </p>
          </div>

          {/* Main card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Warning (if needed) */}
            {!freighterAvailable && (
              <div
                style={{
                  backgroundColor: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: "6px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <AlertCircle
                  className="h-5 w-5 text-yellow-600"
                  style={{ marginTop: "2px" }}
                />
                <div>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#92400e",
                      marginBottom: "8px",
                    }}
                  >
                    Freighter Wallet Required
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#b45309",
                    }}
                  >
                    Please install the Freighter browser extension to continue.{" "}
                    <a
                      href="https://freighter.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontWeight: "600",
                        textDecoration: "underline",
                        color: "#b45309",
                      }}
                    >
                      Download Freighter
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Connect button */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting || !freighterAvailable}
                className="w-full flex items-center justify-center gap-2 h-12"
                style={{
                  width: "100%",
                  height: "48px",
                  backgroundColor:
                    isConnecting || !freighterAvailable ? "#9ca3af" : "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor:
                    isConnecting || !freighterAvailable
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    Connect with Freighter
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  Only authorized admin wallets can access this dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#9ca3af",
            }}
          >
            <p>
              Powered by{" "}
              <a
                href="https://freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#4f46e5", textDecoration: "none" }}
              >
                Freighter Wallet
              </a>{" "}
              &{" "}
              <a
                href="https://stellar.org/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#4f46e5", textDecoration: "none" }}
              >
                Stellar Network
              </a>
            </p>
          </div>
        </div>
      </div>
      {/* Sidebar Improvements Section */}
      <div
        style={{
          margin: "48px auto",
          maxWidth: "600px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          Sidebar Improvements
        </h2>
        <ul
          style={{
            fontSize: "1rem",
            color: "#374151",
            paddingLeft: "20px",
            marginBottom: "0",
          }}
        >
          <li style={{ marginBottom: "16px" }}>
            <strong>
              Fix font color in{" "}
              <span style={{ color: "#000" }}>sidebar navigation</span> on
              submission review pages:
            </strong>
            <ul
              style={{
                marginTop: "8px",
                marginBottom: "0",
                paddingLeft: "20px",
              }}
            >
              <li>
                All button text should be{" "}
                <span style={{ color: "#000", fontWeight: "bold" }}>black</span>
              </li>
            </ul>
          </li>
          <li style={{ marginBottom: "16px" }}>
            <strong>
              Make{" "}
              <span style={{ color: "#000" }}>
                sidebar visible across all pages
              </span>
              , including homepage
            </strong>
          </li>
          <li style={{ marginBottom: "16px" }}>
            <strong>Sidebar behavior:</strong>
            <ul
              style={{
                marginTop: "8px",
                marginBottom: "0",
                paddingLeft: "20px",
              }}
            >
              <li>
                <span style={{ fontWeight: "bold" }}>Collapsed by default</span>{" "}
                (only icons visible)
                <Menu
                  style={{
                    display: "inline",
                    marginLeft: "8px",
                    verticalAlign: "middle",
                  }}
                />
              </li>
              <li>
                <span style={{ fontWeight: "bold" }}>
                  On hover: expand and show button text
                </span>
                <Eye
                  style={{
                    display: "inline",
                    marginLeft: "8px",
                    verticalAlign: "middle",
                  }}
                />
              </li>
              <li>
                <span style={{ fontWeight: "bold" }}>
                  On hover out: collapse again
                </span>
                <MousePointerClick
                  style={{
                    display: "inline",
                    marginLeft: "8px",
                    verticalAlign: "middle",
                  }}
                />
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </>
  );

  // Main login page with inline styles for guaranteed visibility
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#4f46e5",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px auto",
            }}
          >
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            DOB Validator BackOffice
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Connect your Freighter wallet to access the admin dashboard
          </p>
        </div>

        {/* Main card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Warning (if needed) */}
          {!freighterAvailable && (
            <div
              style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "6px",
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <AlertCircle
                className="h-5 w-5 text-yellow-600"
                style={{ marginTop: "2px" }}
              />
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#92400e",
                    marginBottom: "8px",
                  }}
                >
                  Freighter Wallet Required
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#b45309",
                  }}
                >
                  Please install the Freighter browser extension to continue.{" "}
                  <a
                    href="https://freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontWeight: "600",
                      textDecoration: "underline",
                      color: "#b45309",
                    }}
                  >
                    Download Freighter
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Connect button */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting || !freighterAvailable}
              className="w-full flex items-center justify-center gap-2 h-12"
              style={{
                width: "100%",
                height: "48px",
                backgroundColor:
                  isConnecting || !freighterAvailable ? "#9ca3af" : "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "600",
                cursor:
                  isConnecting || !freighterAvailable
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Connect with Freighter
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                Only authorized admin wallets can access this dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          <p>
            Powered by{" "}
            <a
              href="https://freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4f46e5", textDecoration: "none" }}
            >
              Freighter Wallet
            </a>{" "}
            &{" "}
            <a
              href="https://stellar.org/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4f46e5", textDecoration: "none" }}
            >
              Stellar Network
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

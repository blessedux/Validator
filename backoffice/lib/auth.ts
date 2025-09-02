// Authentication utilities for the backoffice
import { adminConfigService } from "./admin-config";
import { apiService } from "./api-service";
import { getSafeBackendUrl } from "./api-utils";
import { freighterService } from "./freighter-service";
import { logWithDOBArt } from "./utils";

export interface AuthToken {
  token: string;
  expiresIn: string;
  walletAddress: string;
}

export interface ChallengeResponse {
  challenge: string;
  message: string;
}

// Store auth token in localStorage
export const storeAuthToken = (
  token: string,
  expiresIn: string,
  walletAddress: string,
) => {
  const authData: AuthToken = {
    token,
    expiresIn,
    walletAddress,
  };
  localStorage.setItem("authToken", JSON.stringify(authData));
};

// Get auth token from localStorage
export const getAuthToken = (): AuthToken | null => {
  if (typeof window === "undefined") return null;

  const authData = localStorage.getItem("authToken");
  if (!authData) return null;

  try {
    return JSON.parse(authData);
  } catch (error) {
    logWithDOBArt("Error parsing auth token in getAuthToken", "error");
    console.error("❌ Error parsing auth token in getAuthToken:", error);
    console.log("❌ Raw auth data:", authData);

    // Check if it's a plain string token (fallback for old format)
    if (
      typeof authData === "string" &&
      (authData.startsWith("dev_fallback_token_") ||
        authData.startsWith("mock_access_token_"))
    ) {
      logWithDOBArt(
        "Detected plain string token, creating fallback structure",
        "warning",
      );
      console.log(
        "🔄 Detected plain string token, creating fallback structure",
      );
      return {
        token: authData,
        expiresIn: "7d",
        walletAddress: "unknown",
      };
    }

    // Clear corrupted data
    localStorage.removeItem("authToken");
    return null;
  }
};

// Remove auth token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const authToken = getAuthToken();
  if (!authToken?.token) {
    return false;
  }

  // Check if it's a mock token (for development/testing)
  if (
    authToken.token.startsWith("mock_access_token_") ||
    authToken.token.startsWith("dev_fallback_token_")
  ) {
    return true;
  }

  // For real JWTs, we could add additional validation here if needed
  return true;
};

// Get authorization header for API requests
export const getAuthHeader = (): { Authorization: string } | {} => {
  const authToken = getAuthToken();
  if (!authToken?.token) return {};

  return {
    Authorization: `Bearer ${authToken.token}`,
  };
};

// Request a challenge for wallet signature
export const requestChallenge = async (
  walletAddress: string,
): Promise<ChallengeResponse> => {
  try {
    logWithDOBArt(
      `Requesting challenge for wallet: ${walletAddress.slice(0, 8)}...`,
      "info",
    );
    const response = await apiService.generateChallenge(walletAddress);
    logWithDOBArt("Challenge generated successfully", "success");
    return {
      challenge: response.challenge,
      message: "Please sign this challenge with your wallet to authenticate",
    };
  } catch (error) {
    logWithDOBArt("Failed to request challenge", "error");
    console.error("Failed to request challenge:", error);
    throw new Error("Failed to request challenge");
  }
};

// Verify wallet signature and get JWT token
export const verifySignature = async (
  walletAddress: string,
  signature: string,
  challenge: string,
): Promise<AuthToken> => {
  logWithDOBArt("Starting signature verification process", "info");
  console.log("🔍 Verifying signature...");
  console.log("🔍 Wallet address:", walletAddress);
  console.log("🔍 Challenge:", challenge);
  console.log("🔍 Signature:", signature.substring(0, 20) + "...");

  try {
    const response = await apiService.verifySignature(
      walletAddress,
      signature,
      challenge,
    );
    logWithDOBArt("Signature verification successful", "success");
    console.log("✅ Verification successful:", response);

    return {
      token: response.token,
      expiresIn: "7d", // Default expiration
      walletAddress,
    };
  } catch (error) {
    logWithDOBArt("Signature verification failed", "error");
    console.error("❌ Verification failed:", error);
    throw new Error("Failed to verify signature");
  }
};

// Complete authentication flow using verify endpoint (same as frontend)
export const authenticateWallet = async (
  walletAddress: string,
  signature: string,
  challenge: string,
) => {
  try {
    logWithDOBArt("Starting wallet-based authentication flow", "info");
    console.log("🚀 Starting wallet-based authentication...");

    // Use the backend verify endpoint directly (same as frontend)
    const backendUrl = getSafeBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ walletAddress, signature, challenge }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Backend auth request failed:",
        response.status,
        errorText,
      );
      throw new Error("Authentication failed");
    }

    const responseData = await response.json();
    logWithDOBArt("Wallet authentication successful", "success");
    console.log("✅ Wallet authentication successful:", responseData);

    // Store the session data
    const authToken = {
      token: responseData.token,
      expiresIn: "7d",
      walletAddress,
    };

    storeAuthToken(
      authToken.token,
      authToken.expiresIn,
      authToken.walletAddress,
    );
    logWithDOBArt("Authentication token stored successfully", "success");
    return authToken;
  } catch (error) {
    logWithDOBArt("Wallet authentication failed", "error");
    console.error("❌ Authentication failed:", error);
    throw error;
  }
};

// Logout user
export const logout = () => {
  const authToken = getAuthToken();

  logWithDOBArt("Starting user logout process", "info");

  // Clear frontend storage
  removeAuthToken();
  localStorage.removeItem("stellarPublicKey");
  localStorage.removeItem("stellarWallet");
  localStorage.removeItem("userProfile");

  // Clear backend session if we have wallet address
  if (authToken?.walletAddress) {
    // Note: In a real app, you'd call an API endpoint to clear the session
    // For now, we'll just clear local storage
    logWithDOBArt(
      `Logging out wallet: ${authToken.walletAddress.slice(0, 8)}...`,
      "info",
    );
    console.log("🚪 Logging out wallet:", authToken.walletAddress);
  }

  // Clear session storage as well
  sessionStorage.clear();

  logWithDOBArt("User logout completed successfully", "success");
  window.dispatchEvent(new Event("walletStateChange"));
};

// Make authenticated API request
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
) => {
  const authHeader = getAuthHeader();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...authHeader,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid, logout user
    logout();
    throw new Error("Authentication expired");
  }

  return response;
};

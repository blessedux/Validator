"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    name?: string;
    company?: string;
    email?: string;
    profileImage?: string;
  }>({});

  useEffect(() => {
    const address = localStorage.getItem("stellarPublicKey");
    setWalletAddress(address);

    const profileData = localStorage.getItem("userProfile");
    if (profileData) {
      try {
        setProfile(JSON.parse(profileData));
      } catch {
        setProfile({});
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-md mx-auto mt-8 rounded-xl shadow-lg p-8 border border-card bg-card relative">
          <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
            My Profile
          </h2>
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-border mb-4">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-4xl">👤</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {profile.name || "No name set"}
              </p>
              <p className="text-sm text-muted-foreground">
                {profile.company || "No company/project"}
              </p>
              <p className="text-sm text-muted-foreground">
                {profile.email || "No email"}
              </p>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg border border-border mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Wallet Address
            </h3>
            <p className="font-mono text-xs break-all text-blue-700 bg-blue-50 p-2 rounded">
              {walletAddress || "No wallet connected"}
            </p>
          </div>
          <div className="bg-muted p-4 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              Your profile information is private and only visible to you.
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

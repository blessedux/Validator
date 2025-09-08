"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Star,
  Wallet,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Zap,
  Shield,
  TrendingUp,
  Award,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import * as z from "zod";
import { adminConfigService } from "@/lib/admin-config";
import { apiService, Submission } from "@/lib/api-service";
import { isAuthenticated } from "@/lib/auth";
import { useSearchParams, useRouter } from "next/navigation";
import { freighterService } from '@/lib/freighter-service'

import { stellarContractService } from "@/lib/stellar-contract";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
};

interface SubmissionReviewProps {
  submissionId?: string;
  onBack?: () => void;
}

export function SubmissionReview({
  submissionId,
  onBack,
}: SubmissionReviewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trufaScores, setTrufaScores] = useState({
    technical: [75],
    regulatory: [80],
    financial: [70],
  });
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [stellarTxHash, setStellarTxHash] = useState("");
  const [txStatus, setTxStatus] = useState<"pending" | "confirmed" | null>(
    null,
  );
  const [copiedHash, setCopiedHash] = useState(false);
  const [openPdf, setOpenPdf] = useState<string | null>(null);

  // Real wallet connection state
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isWalletWhitelisted, setIsWalletWhitelisted] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string>("");

  // Get submission ID from URL params or props
  const currentSubmissionId = submissionId || searchParams.get("id") || "";

  // Calculate average score (must be before any conditional returns)
  const averageScore = Math.round(
    Object.values(trufaScores).reduce((sum, score) => sum + score[0], 0) / 3,
  );

  // Fetch submission data
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!currentSubmissionId) {
        setError("No submission ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated()) {
          setError("Authentication required");
          // Redirect to home for re-authentication
          router.push("/");
          return;
        }

        const submissionData =
          await apiService.getSubmissionById(currentSubmissionId);

        setSubmission(submissionData);
        // Initialize TRUFA scores from existing admin review if available
        if (submissionData.admin_review) {
          const review = submissionData.admin_review;
          setTrufaScores({
            technical: [review.technical_score || 75],
            regulatory: [review.regulatory_score || 80],
            financial: [review.financial_score || 70],
          });
        }
        // Load existing admin notes
        if (submissionData.admin_review?.notes) {
          setReviewerNotes(submissionData.admin_review.notes);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        // If error is 401, redirect to home
        if (
          errorMessage.includes("401") ||
          errorMessage.toLowerCase().includes("unauthorized")
        ) {
          router.push("/");
          return;
        }
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [currentSubmissionId, toast, router]);

  // Check wallet connection and admin status on mount
  useEffect(() => {
    const checkWalletStatus = () => {
      const walletAddress = localStorage.getItem("stellarPublicKey");
      if (walletAddress) {
        setConnectedWallet(walletAddress);
        setIsWalletConnected(true);

        // Check if wallet is admin
        const isAdmin = adminConfigService.isAdminWallet(walletAddress);
        setIsWalletWhitelisted(isAdmin);

        console.log("Wallet status:", {
          address: walletAddress,
          isConnected: true,
          isAdmin,
          permissions:
            adminConfigService.getAdminWallet(walletAddress)?.permissions,
        });
      }
    };

    checkWalletStatus();

    // Listen for wallet changes
    const handleWalletChange = () => {
      checkWalletStatus();
    };

    window.addEventListener("walletStateChange", handleWalletChange);
    window.addEventListener("storage", handleWalletChange);

    return () => {
      window.removeEventListener("walletStateChange", handleWalletChange);
      window.removeEventListener("storage", handleWalletChange);
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading submission...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !submission) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Error Loading Submission
              </h2>
              <p className="text-muted-foreground mb-4">
                {error || "Submission not found"}
              </p>
              {onBack && (
                <Button onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inbox
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSignAndSubmit = async () => {
    if (
      !isWalletConnected ||
      !isWalletWhitelisted ||
      isApproved === null ||
      !submission
    ) {
      toast({
        title: "Cannot Submit",
        description:
          "Please connect an admin wallet and make a decision before submitting.",
        variant: "destructive",
      });
      return;
    }
    if (!submission.id) {
      toast({
        title: "Submission Error",
        description: "Submission data is missing or invalid (no ID).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 Starting validation submission...");
      // Defensive: log submission object
      console.log("Submission object:", submission);
      // Update submission status
      const updateResponse = await apiService.updateSubmissionStatus(
        submission.id,
        isApproved ? "APPROVED" : "REJECTED",
      );

      if (!updateResponse || !updateResponse.success) {
        throw new Error("Failed to update submission status in database");
      }

      // Create TRUFA metadata using production-ready service
      const metadata = stellarContractService.createTrufaMetadata({
        submissionId: submission.id,
        deviceName: submission.deviceName || "N/A",
        deviceType: submission.deviceType || "N/A",
        operatorWallet: submission.user?.walletAddress || "N/A",
        validatorWallet: connectedWallet,
        trufaScores: {
          technical: trufaScores.technical[0],
          regulatory: trufaScores.regulatory[0],
          financial: trufaScores.financial[0],
          environmental: 85,
          overall: averageScore,
        },
        decision: isApproved ? "APPROVED" : "REJECTED",
      });
      console.log("Created TRUFA metadata:", metadata);

      if (
        !metadata.submissionId

      ) {
        console.log(metadata.submissionId, metadata.deviceName, metadata.deviceType, metadata.operatorWallet);
        toast({
          title: "Metadata Error",
          description: "Some required metadata fields are missing.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Verify admin wallet permissions
      const adminWallet = adminConfigService.getAdminWallet(connectedWallet);
      if (!adminWallet) {
        toast({
          title: "Admin Wallet Error",
          description: "Admin wallet not found or not authorized.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      console.log("🔐 Preparing Stellar smart contract submission...");
      console.log("📋 TRUFA Metadata payload:", metadata);

      // Initialize Stellar contract service
      await stellarContractService.initialize();

      // Create transaction signing function using the connected wallet
      const signTransaction = async (transactionXdr: string): Promise<string> => {
        
        const signedXdr = await freighterService.signTransaction(transactionXdr, {
          networkPassphrase: 'Test SDF Network ; September 2015', // CHANGE IF USING MAINNET
          accountToSign: connectedWallet
        })
      
        return signedXdr;
      };

      // Submit to Stellar contract
      const contractResult =
        await stellarContractService.submitValidationToSoroban({
          adminPublic: connectedWallet,
          metadata,
          signTransaction,
        });

      if (contractResult.success && contractResult.transactionHash) {
        setStellarTxHash(contractResult.transactionHash);
        setIsSubmitted(true);
        setTxStatus("confirmed");
        // Generate and send certificate on backend
        const certResponse = await apiService.generateCertificate(
          submission.id,
          contractResult.transactionHash,
        );
        toast({
          title: "Validation Submitted to Stellar!",
          description: `Decision: ${isApproved ? "APPROVED" : "REJECTED"} | Score: ${averageScore}/100 | Tx: ${contractResult.transactionHash.slice(0, 8)}...`,
        });

        console.log("Stellar contract submission successful:", {
          submissionId: submission.id,
          decision: isApproved ? "APPROVED" : "REJECTED",
          trufaScore: averageScore,
          metadataHash: metadata.metadataHash,
          transactionHash: contractResult.transactionHash,
          adminWallet: connectedWallet,
        });

        console.log(
          "Certificate generation response from backend:",
          certResponse,
        )
      } else {
        throw new Error(contractResult.error || "Contract submission failed");
      }
    } catch (error) {
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      console.log("Error during submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTxHash = async () => {
    await navigator.clipboard.writeText(stellarTxHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const canSign =
    isWalletConnected &&
    isWalletWhitelisted &&
    isApproved !== null &&
    !isSubmitted;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {submission.device_name || "N/A"}
                </h1>
                <Badge
                  className={
                    statusColors[submission.status as keyof typeof statusColors]
                  }
                >
                  {submission.status?.replace("_", " ").toLowerCase() ||
                    "Unknown"}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3" />
                  TRUFA: {averageScore}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {submission.id} • Submitted by{" "}
                {submission.user?.wallet_address
                  ? `${submission.user.wallet_address.slice(0, 8)}...${submission.user.wallet_address.slice(-8)}`
                  : "Unknown"}{" "}
                on {new Date(submission.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isWalletConnected ? (
                <Badge variant="outline" className="gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <Wallet className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full" />
                  <Wallet className="h-3 w-3" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Documentation & Metadata */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Description */}
            <Card>
              <CardHeader>
                <CardTitle>Device Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Device Type
                    </Label>
                    <p className="font-medium">
                      {submission.device_type || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Manufacturer
                    </Label>
                    <p className="font-medium">
                      {submission.manufacturer || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Model
                    </Label>
                    <p className="font-medium">{submission.model || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Serial Number
                    </Label>
                    <p className="font-medium">
                      {submission.serial_number || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Year of Manufacture
                    </Label>
                    <p className="font-medium">
                      {submission.year_of_manufacture || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Condition
                    </Label>
                    <p className="font-medium">
                      {submission.condition || "N/A"}
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Specifications
                  </Label>
                  <p className="text-sm leading-relaxed mt-1">
                    {submission.specifications || "No specifications provided"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
                <CardDescription>
                  Device financial metrics and projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Purchase Price
                    </Label>
                    <p className="font-medium">
                      $
                      {submission.purchase_price
                        ? Number(submission.purchase_price).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Current Value
                    </Label>
                    <p className="font-medium">
                      $
                      {submission.current_value
                        ? Number(submission.current_value).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Expected Revenue
                    </Label>
                    <p className="font-medium">
                      $
                      {submission.expected_revenue
                        ? Number(submission.expected_revenue).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Operational Costs
                    </Label>
                    <p className="font-medium">
                      $
                      {submission.operational_costs
                        ? Number(submission.operational_costs).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentation Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentation
                </CardTitle>
                <CardDescription>
                  Review submitted device documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Documentation feature not yet implemented
                </p>
              </CardContent>
            </Card>

            {/* Reviewer Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Reviewer Notes</CardTitle>
                <CardDescription>
                  Add your validation comments and observations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your detailed review notes, concerns, or recommendations..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - TRUFA Scoring & Actions */}
          <div className="space-y-6">
            {/* TRUFA Scoring */}
            <Card>
              <CardHeader>
                <CardTitle>TRUFA Scoring</CardTitle>
                <CardDescription>Evaluate across key criteria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Technical Feasibility</Label>
                      <span className="text-sm font-medium">
                        {trufaScores.technical[0]}
                      </span>
                    </div>
                    <Slider
                      value={trufaScores.technical}
                      onValueChange={(value) =>
                        setTrufaScores((prev) => ({
                          ...prev,
                          technical: value,
                        }))
                      }
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Regulatory Compliance</Label>
                      <span className="text-sm font-medium">
                        {trufaScores.regulatory[0]}
                      </span>
                    </div>
                    <Slider
                      value={trufaScores.regulatory}
                      onValueChange={(value) =>
                        setTrufaScores((prev) => ({
                          ...prev,
                          regulatory: value,
                        }))
                      }
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Financial Viability</Label>
                      <span className="text-sm font-medium">
                        {trufaScores.financial[0]}
                      </span>
                    </div>
                    <Slider
                      value={trufaScores.financial}
                      onValueChange={(value) =>
                        setTrufaScores((prev) => ({
                          ...prev,
                          financial: value,
                        }))
                      }
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                <Separator />

                <div className="text-center">
                  <div className="text-3xl font-bold text-[hsl(var(--primary))]">
                    {averageScore}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Overall TRUFA Score
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Approval Decision */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Decision</CardTitle>
                <CardDescription>
                  Approve or reject this submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={isApproved === false ? "destructive" : "outline"}
                    size="lg"
                    onClick={() => setIsApproved(false)}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant={isApproved === true ? "default" : "outline"}
                    size="lg"
                    onClick={() => setIsApproved(true)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>

                {isApproved !== null && (
                  <Alert
                    className={
                      isApproved
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                        : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                    }
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {isApproved
                        ? "Device approved for certification. Ready to sign and submit to Stellar."
                        : "Device rejected. This decision will be recorded on-chain."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Wallet Status & Signing */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Status</CardTitle>
                <CardDescription>
                  Admin wallet connection and signing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Status</span>
                    <Badge
                      variant={isWalletConnected ? "default" : "secondary"}
                    >
                      {isWalletConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Admin Status</span>
                    <Badge
                      variant={isWalletWhitelisted ? "default" : "secondary"}
                    >
                      {isWalletWhitelisted ? "Admin" : "Not Admin"}
                    </Badge>
                  </div>
                  {connectedWallet && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {connectedWallet.slice(0, 8)}...
                      {connectedWallet.slice(-8)}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSignAndSubmit}
                  disabled={!canSign}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <img
                        src="/stellar_logo_white_small.svg"
                        alt="Stellar Logo"
                        width={20}
                        height={20}
                        className="mr-2"
                        style={{
                          display: "inline-block",
                          verticalAlign: "middle",
                        }}
                      />
                      Sign & Submit to Stellar
                    </>
                  )}
                </Button>

                {!isWalletConnected && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please connect an admin wallet to sign and submit this
                      validation.
                    </AlertDescription>
                  </Alert>
                )}

                {isWalletConnected && !isWalletWhitelisted && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connected wallet is not authorized as an admin. Please
                      connect an admin wallet.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Transaction Status */}
            {isSubmitted && (
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Status</CardTitle>
                  <CardDescription>
                    Stellar blockchain transaction details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Transaction Hash</Label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {stellarTxHash}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyTxHash}
                        className="shrink-0"
                      >
                        {copiedHash ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge
                      variant={
                        txStatus === "confirmed" ? "default" : "secondary"
                      }
                    >
                      {txStatus === "confirmed" ? "Confirmed" : "Pending"}
                    </Badge>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${stellarTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Stellar Expert
                    </a>
                  </Button>

                  {txStatus === "confirmed" && (
                    <Button variant="outline" className="w-full">
                      <Award className="h-4 w-4 mr-2" />
                      Show Certificate
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

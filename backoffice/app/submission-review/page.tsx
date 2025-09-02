"use client";

import { Suspense } from "react";
import { SubmissionReview } from "@/components/submission-review";
import { SubmissionsList } from "@/components/submissions-list";
import {
  SimpleSidebar,
  SimpleSidebarContent,
  SimpleSidebarHeader,
  SimpleSidebarMenu,
  SimpleSidebarMenuButton,
} from "@/components/ui/simple-sidebar";
import { Button } from "@/components/ui/button";
import { Shield, FileText, BarChart3, Settings, Home } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";

function SubmissionReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("id");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1 p-6">
          {submissionId ? (
            <SubmissionReview
              submissionId={submissionId}
              onBack={() => router.push("/submission-review")}
            />
          ) : (
            <SubmissionsList />
          )}
        </main>
      </div>
    </div>
  );
}

export default function SubmissionReviewPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-screen bg-background">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            </div>
          </div>
        }
      >
        <SubmissionReviewContent />
      </Suspense>
    </ErrorBoundary>
  );
}

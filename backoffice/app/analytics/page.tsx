"use client";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-2xl mx-auto mt-8 rounded-xl shadow-lg p-8 border border-card bg-card">
          <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
            Analytics
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Here you can view analytics and data about the platform. (Dummy data
            for now)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-6 flex flex-col items-center">
              <span className="text-5xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                128
              </span>
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg p-6 flex flex-col items-center">
              <span className="text-5xl font-bold text-green-700 dark:text-green-300 mb-2">
                87
              </span>
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-lg p-6 flex flex-col items-center">
              <span className="text-5xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                23
              </span>
              <span className="text-sm text-muted-foreground">
                Pending Reviews
              </span>
            </div>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-6 flex flex-col items-center">
              <span className="text-5xl font-bold text-red-700 dark:text-red-300 mb-2">
                18
              </span>
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-card">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Recent Activity
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Lorem ipsum dolor sit amet.</li>
            </ul>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

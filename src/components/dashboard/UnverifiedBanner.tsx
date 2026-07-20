import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function UnverifiedBanner() {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // If user doesn't exist or is already verified, don't show the banner
  if (!user || user.emailVerified !== false) {
    return null;
  }

  const handleResend = async () => {
    try {
      setIsResending(true);
      await authAPI.resendVerification(user.email);
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-yellow-500/15 border-b border-yellow-500/30 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex flex-row items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Your email address is unverified. You cannot create new bills until you verify your email.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={isResending}
          className="shrink-0 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-700"
        >
          {isResending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Resend Verification
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verifyToken = async () => {
      try {
        await authAPI.verifyEmail(token);
        setStatus("success");
        setMessage("Your email has been successfully verified!");
        if (user) {
          updateUser({ ...user, emailVerified: true });
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Failed to verify email. The link may have expired.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background rounded-xl border shadow-sm p-8 text-center space-y-6">
        <div className="flex justify-center">
          {status === "loading" && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
          {status === "success" && <CheckCircle className="h-12 w-12 text-green-500" />}
          {status === "error" && <AlertCircle className="h-12 w-12 text-destructive" />}
        </div>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Email Verification</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        <Button 
          className="w-full" 
          onClick={() => navigate("/dashboard")}
          disabled={status === "loading"}
        >
          {status === "success" ? "Go to Dashboard" : "Back to Home"}
        </Button>
      </div>
    </div>
  );
}

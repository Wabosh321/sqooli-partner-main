import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Mail, RotateCcw } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResending, setIsResending] = React.useState(false);

  // Get email from navigation state (set by SignUp page)
  const email = (location.state as any)?.email || "";

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Email address not found. Please sign up again.");
      navigate("/signUp");
      return;
    }

    setIsResending(true);
    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const callbackUrl = `${appUrl.replace(/\/$/, "")}/auth/callback`;

      const { error } = await supabase.auth.signUp({
        email,
        password: "placeholder",
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        toast.error("Failed to resend email. Please try again.");
        return;
      }

      toast.success("Verification email resent! Check your inbox.");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="bg-primary/10 rounded-full p-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Verify Your Email
          </h1>
          <p className="text-muted-foreground">
            We've sent a verification link to:
          </p>
          <p className="font-medium text-foreground">{email}</p>
        </div>

        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-foreground">What's next?</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Check your email inbox (and spam folder just in case)</li>
            <li>Click the verification link in the email</li>
            <li>
              You'll be automatically signed in and redirected to your dashboard
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Didn't receive the email?
          </p>
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full h-11"
          >
            {isResending ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already verified?{" "}
          <a href="/signIn" className="text-primary hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}

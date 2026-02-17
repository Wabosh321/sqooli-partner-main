import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = React.useState(true);

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL parameters
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const error_description = searchParams.get("error_description");

        if (error) {
          toast.error(error_description || "Email verification failed");
          navigate("/signUp");
          return;
        }

        if (!code) {
          toast.error("Invalid verification link");
          navigate("/signUp");
          return;
        }

        // Exchange the code for a valid session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          toast.error("Email verification failed. Please try again.");
          navigate("/signUp");
          return;
        }

        if (!sessionData || !sessionData.session) {
          toast.error("Email verification failed");
          navigate("/signUp");
          return;
        }

        const pendingReg = sessionStorage.getItem("pendingRegistration");
        if (!pendingReg) {
          toast.error("Registration data not found. Please sign up again.");
          navigate("/signUp");
          return;
        }

        const regData = JSON.parse(pendingReg);

        const { data: profileData, error: profileError } = await supabase.rpc(
          "create_user_profile",
          {
            p_email: regData.email,
            p_full_name: `${regData.firstName} ${regData.lastName}`,
            p_phone: regData.phoneNumber,
            p_username: regData.username,
          },
        );

        if (profileError) {
          toast.error(
            profileError.message ||
              "Account verified but profile creation failed. Please contact support.",
          );
          navigate("/signUp");
          return;
        }

        // Success! Clean up sessionStorage
        sessionStorage.removeItem("pendingRegistration");

        // Show success message
        toast.success("Email verified! Your account is ready.");

        // Redirect to dashboard or onboarding
        navigate("/dashboard");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An error occurred during email verification",
        );
        navigate("/signUp");
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
        <h2 className="text-xl font-semibold">Verifying your email...</h2>
        <p className="text-muted-foreground">
          {isProcessing
            ? "Please wait while we set up your account."
            : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}

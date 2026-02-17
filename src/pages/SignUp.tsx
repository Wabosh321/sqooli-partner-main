import React from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  validateRegistrationData,
  getPasswordStrength,
} from "../utils/handleRegister";
import type { RegisterFormData, ValidationErrors } from "../types/auth.types";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDeviceSize } from "../hooks/useDeviceSize";
import { supabase } from "../lib/supabase";
import AuthLayout from "../components/auth/AuthLayout";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<
    Set<keyof RegisterFormData>
  >(new Set());
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const navigate = useNavigate();
  const { isMobile } = useDeviceSize();

  const [signupData, setSignupData] = React.useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const validateSingleField = (
    field: keyof RegisterFormData,
    value: string,
  ) => {
    const tempData = { ...signupData, [field]: value };
    const allErrors = validateRegistrationData(tempData);
    return allErrors[field];
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    setTouchedFields((prev) => new Set(prev).add(field));
    const error = validateSingleField(field, signupData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setSignupData((prev) => ({ ...prev, [field]: value }));
    if (touchedFields.has(field)) {
      const error = validateSingleField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const isFormValid = () => {
    const allErrors = validateRegistrationData(signupData);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async () => {
    const allFields = new Set(
      Object.keys(signupData) as (keyof RegisterFormData)[],
    );
    setTouchedFields(allFields);
    const newErrors = validateRegistrationData(signupData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsLoading(true);

    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const callbackUrl = `${appUrl.replace(/\/$/, "")}/auth/callback`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email.toLowerCase().trim(),
        password: signupData.password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            phoneNumber: signupData.phoneNumber,
            username: signupData.username,
          },
        },
      });

      if (authError) {
        toast.error(
          authError.message || "Registration failed. Please try again.",
        );
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem(
        "pendingRegistration",
        JSON.stringify({
          authId: authData.user.id,
          email: signupData.email.toLowerCase().trim(),
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          phoneNumber: signupData.phoneNumber,
          username: signupData.username,
        }),
      );

      toast.success(
        "Sign up successful! Please check your email to verify your account.",
      );

      navigate("/auth/verify-email", {
        state: { email: signupData.email },
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred during registration.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Sign Up</h1>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <Input
              type="text"
              placeholder="John"
              value={signupData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              className="h-10"
              disabled={isLoading}
            />
            {errors.firstName && touchedFields.has("firstName") && (
              <p className="text-xs text-destructive mt-1">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <Input
              type="text"
              placeholder="Doe"
              value={signupData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              className="h-10"
              disabled={isLoading}
            />
            {errors.lastName && touchedFields.has("lastName") && (
              <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={signupData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className="h-10"
              disabled={isLoading}
            />
            {errors.email && touchedFields.has("email") && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="+254 700 000000"
              value={signupData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              onBlur={() => handleBlur("phoneNumber")}
              className="h-10"
              disabled={isLoading}
            />
            {errors.phoneNumber && touchedFields.has("phoneNumber") && (
              <p className="text-xs text-destructive mt-1">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input
              type="text"
              placeholder="john_doe"
              value={signupData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              onBlur={() => handleBlur("username")}
              className="h-10"
              disabled={isLoading}
            />
            {errors.username && touchedFields.has("username") && (
              <p className="text-xs text-destructive mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={signupData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                className="h-10 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && touchedFields.has("password") && (
              <p className="text-xs text-destructive mt-1">{errors.password}</p>
            )}
            {signupData.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const strength = getPasswordStrength(signupData.password);
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < strength.score ? strength.color : "bg-muted"
                        }`}
                      />
                    );
                  })}
                </div>
                <p
                  className={`text-xs mt-1 ${getPasswordStrength(signupData.password).color}`}
                >
                  {getPasswordStrength(signupData.password).label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                onBlur={() => handleBlur("confirmPassword")}
                className="h-10 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && touchedFields.has("confirmPassword") && (
              <p className="text-xs text-destructive mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-11 bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/signIn" className="text-primary hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}

'use client';

import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { validateLoginData } from '../utils/handleLogin';
import { handleSignIn } from '../utils/handleAuthWithSupabase';
import type { LoginFormData, LoginValidationErrors } from '../types/auth.types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { useDeviceSize } from '../hooks/useDeviceSize';

// Local design exports (replacing the decorative left panel and logo)
import AuthLayout from '../components/auth/AuthLayout';

export default function SignIn() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<keyof LoginFormData>>(new Set());
  const [errors, setErrors] = React.useState<LoginValidationErrors>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useDeviceSize();

  const [loginData, setLoginData] = React.useState<LoginFormData>({
    email: '',
    password: ''
  });

  // Validate single field
  const validateSingleField = (field: keyof LoginFormData, value: string) => {
    const tempData = { ...loginData, [field]: value };
    const allErrors = validateLoginData(tempData);
    return allErrors[field];
  };

  // Handle field blur
  const handleBlur = (field: keyof LoginFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateSingleField(field, loginData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle field change with live validation
  const handleChange = (field: keyof LoginFormData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));

    if (touchedFields.has(field)) {
      const error = validateSingleField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const isFormValid = () => {
    const allErrors = validateLoginData(loginData);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async () => {
      const params = new URLSearchParams(location.search);
      const extension = params.get("extension");
      const allFields = new Set(Object.keys(loginData) as (keyof LoginFormData)[]);
      setTouchedFields(allFields);

      const newErrors = validateLoginData(loginData);
      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        toast.error('Please correct the errors above to continue');
        return;
      }

      setIsLoading(true);

      try {
        let result;
        if (extension) {
          // Login via Edge Function
          try {
            const loginResponse = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: loginData.email,
                password: loginData.password,
                extension,
              }),
            }).then(r => r.json());

            if (!loginResponse.user) {
              throw new Error('Invalid email or password');
            }

            if (!loginResponse.user.is_account_activated) {
              throw new Error('Your account needs activation. Please contact your administrator');
            }

            result = {
              success: true,
              message: 'Login successful',
              user: loginResponse.user,
            };
          } catch (error: unknown) {
            console.error('Login failed:', error);
            let message = 'An unexpected error occurred. Please try again';
            
            if (
              error &&
              typeof error === 'object' &&
              'message' in error &&
              typeof (error as { message?: unknown }).message === 'string'
            ) {
              const errorMsg = (error as { message: string }).message;
              
              // Transform backend error messages to user-friendly ones
              if (errorMsg.includes('Invalid email or password')) {
                message = 'The email or password you entered is incorrect';
              } else if (errorMsg.includes('Invalid extension')) {
                message = 'Invalid login link. Please use the correct sign-in URL';
              } else if (errorMsg.includes('Account not activated') || errorMsg.includes('not activated')) {
                message = 'Your account needs activation. Please contact your administrator';
              } else {
                message = errorMsg;
              }
              
              // Clear password field for password-related errors
              if (message.includes('password') || message.includes('incorrect')) {
                setLoginData(prev => ({ ...prev, password: '' }));
              }
            }
            
            result = {
              success: false,
              message,
            };
          }
        } else {
          // Default Supabase login
          result = await handleSignIn(loginData.email.trim().toLowerCase(), loginData.password);
        }

        if (!result?.success) {
          toast.error(result?.message || 'The email or password you entered is incorrect');
          return;
        }

        toast.success('Login successful! 🎉');

        
        // Supabase manages session in client; no Convex session cookie required
        
        navigate('/select-account');
        window.location.reload(); 
      } catch (error) {
        console.error('Login error:', error);
        toast.error('An unexpected error occurred. Please try again');
      } finally {
        setIsLoading(false);
      }
    };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid() && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <AuthLayout>
      {/* Already Signed In State or Sign In form */}
      {user ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-secondary/10 border-2 border-secondary rounded-lg p-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-secondary`} />
            </div>
            <h2 className="text-signin-heading dark:text-foreground">You're Already Signed In!</h2>
            <p className="text-signin-description dark:text-muted-foreground">Welcome back! You're currently logged in and ready to go.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-11 mt-4">Go to Dashboard</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8" onKeyPress={handleKeyPress}>
          <div className="flex flex-col gap-2 text-center">
            <h2 className={`font-quicksand font-bold text-[#101828] tracking-[-0.48px] ${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-[24px]'}`}>Sign In</h2>
            <p className={`font-quicksand font-normal text-[#475467] ${isMobile ? 'text-sm' : 'text-[16px]'}`}>Please provide your credentials to proceed</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-quicksand font-medium text-[14px] leading-[20px] text-[#344054]">Email Address</label>
              <Input type="email" placeholder="james@schoolhub.com" value={loginData.email} onChange={(e) => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} className={`w-full h-10 px-3 py-2 text-[14px] font-quicksand font-normal text-[#667085] placeholder:text-[#667085] border border-[#d0d5dd] rounded-[30px] bg-gray-50 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] focus:outline-none focus:ring-2 focus:ring-[#3498db] ${errors.email && touchedFields.has('email') ? 'border-destructive' : ''}`} disabled={isLoading} />
              {errors.email && touchedFields.has('email') && (<p className="text-xs text-destructive mt-1">{errors.email}</p>)}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-quicksand font-medium text-[14px] leading-[20px] text-[#344054]">Password</label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={loginData.password} onChange={(e) => handleChange('password', e.target.value)} onBlur={() => handleBlur('password')} className={`w-full h-10 px-3 py-2 pr-10 text-[14px] font-quicksand font-normal text-[#667085] placeholder:text-[#667085] border border-[#d0d5dd] rounded-[30px] bg-gray-50 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] focus:outline-none focus:ring-2 focus:ring-[#3498db] ${errors.password && touchedFields.has('password') ? 'border-destructive' : ''}`} disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#344054]" disabled={isLoading}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              {errors.password && touchedFields.has('password') && (<p className="text-xs text-destructive mt-1">{errors.password}</p>)}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={handleSubmit} disabled={!isFormValid() || isLoading} className="w-full h-10 bg-[#3498db] hover:bg-[#2980b9] text-white font-quicksand font-bold text-[16px] rounded-[30px] disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing In...</>) : ('Sign In')}</Button>

              <div className="text-center">
                <p className={`font-quicksand font-normal text-[#1c1c1c] ${isMobile ? 'text-sm' : 'text-[16px]'}`}>Don't have an account?{' '}<a onClick={() => navigate('/signUp')} className="font-quicksand font-semibold text-[#3498db] underline hover:opacity-80 cursor-pointer">Learn how to Get Started</a></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

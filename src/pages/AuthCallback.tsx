import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeUserProfile } from '../utils/completeUserProfile';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Supabase automatically handles the token exchange from the URL
        // Now complete the user profile creation
        const result = await completeUserProfile();
        
        if (result.success) {
          // Profile created successfully, redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // Profile creation failed
          setErrorMessage(result.message);
          // Redirect back to signup after 3 seconds
          setTimeout(() => {
            navigate('/signUp', { 
              replace: true,
              state: { error: result.message } 
            });
          }, 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        const message = error instanceof Error ? error.message : 'An error occurred';
        setErrorMessage(message);
        
        // Redirect back to signup after 3 seconds
        setTimeout(() => {
          navigate('/signUp', { 
            replace: true,
            state: { error: message } 
          });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center space-y-4">
        {isProcessing ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold">Verifying Email</h1>
            <p className="text-muted-foreground">Setting up your profile...</p>
          </>
        ) : errorMessage ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="text-destructive">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">Redirecting to sign up...</p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Email Verified!</h1>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
}

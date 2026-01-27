import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { handleRegister, validateRegistrationData, getPasswordStrength } from '../utils/handleRegister';
import type { RegisterFormData, ValidationErrors } from '../types/auth.types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDeviceSize } from '../hooks/useDeviceSize';
import AuthLayout from '../components/auth/AuthLayout';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<keyof RegisterFormData>>(new Set());
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const navigate = useNavigate();
  const { isMobile } = useDeviceSize();

  const [signupData, setSignupData] = React.useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const validateSingleField = (field: keyof RegisterFormData, value: string) => {
    const tempData = { ...signupData, [field]: value };
    const allErrors = validateRegistrationData(tempData);
    return allErrors[field];
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateSingleField(field, signupData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
    if (touchedFields.has(field)) {
      const error = validateSingleField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const isFormValid = () => {
    const allErrors = validateRegistrationData(signupData);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async () => {
    const allFields = new Set(Object.keys(signupData) as (keyof RegisterFormData)[]);
    setTouchedFields(allFields);
    const newErrors = validateRegistrationData(signupData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await handleRegister(signupData);

      if (!result.success) {
        toast.error(result.message || 'Registration failed.');
        return;
      }

      toast.success('Registration successful! Sign in now.');
      navigate('/signIn');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Sign Up</h1>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">First Name</label>
            <Input type="text" placeholder="John" value={signupData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} onBlur={() => handleBlur('firstName')} className="h-10" />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Last Name</label>
            <Input type="text" placeholder="Doe" value={signupData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} onBlur={() => handleBlur('lastName')} className="h-10" />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="name@example.com" value={signupData.email} onChange={(e) => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} className="h-10" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <Input type="tel" placeholder="+254 700 000000" value={signupData.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} onBlur={() => handleBlur('phoneNumber')} className="h-10" />
            {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Username</label>
            <Input type="text" placeholder="johndoe" value={signupData.username} onChange={(e) => handleChange('username', e.target.value)} onBlur={() => handleBlur('username')} className="h-10" />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={signupData.password} onChange={(e) => handleChange('password', e.target.value)} onBlur={() => handleBlur('password')} className="h-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={signupData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} onBlur={() => handleBlur('confirmPassword')} className="h-10 pr-10" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>

          <Button onClick={handleSubmit} disabled={!isFormValid() || isLoading} className="w-full h-10">{isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>) : 'Sign Up'}</Button>

          <p className="text-center text-sm text-muted-foreground">Already have an account?{' '}<a onClick={() => navigate('/signIn')} className="text-primary hover:underline cursor-pointer">Sign In</a></p>
        </div>
      </div>
    </AuthLayout>
  );
}

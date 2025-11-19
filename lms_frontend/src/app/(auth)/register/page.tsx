"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterInput, registerSchema } from "@/lib/validators/auth";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2, GraduationCap, UserPlus, Building2, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "@/components/ui/Toast";

type RegistrationStep = 'role' | 'details' | 'otp' | 'complete';
type RegistrationRole = 'student' | 'organization';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<RegistrationStep>('role');
  const [selectedRole, setSelectedRole] = useState<RegistrationRole | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const emailValue = watch('email');

  const handleRoleSelect = (role: RegistrationRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSendOTP = async () => {
    if (!emailValue || !selectedRole) {
      setError('Please fill in your email and select a role');
      return;
    }

    setSendingOTP(true);
    setError(null);
    setRegistrationEmail(emailValue);

    try {
      await apiClient.sendRegistrationOTP(emailValue, selectedRole);
      setOtpSent(true);
      setStep('otp');
      showToast('OTP sent successfully! Please check your email.', 'success', 5000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to send OTP. Please try again.';
      setError(errorMsg);
      showToast(errorMsg, 'error', 5000);
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setVerifyingOTP(true);
    setError(null);

    try {
      await apiClient.verifyRegistrationOTP(registrationEmail, otpCode);
      setStep('details');
      showToast('OTP verified successfully!', 'success', 3000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Invalid or expired OTP code';
      setError(errorMsg);
      showToast(errorMsg, 'error', 5000);
    } finally {
      setVerifyingOTP(false);
    }
  };

  const onSubmit = async (values: RegisterInput) => {
    setError(null);
    
    if (!selectedRole) {
      setError('Please select a registration type');
      return;
    }
    
    try {
      const result = await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        acceptTerms: values.acceptTerms,
        role: selectedRole,
      }, otpCode);

      if (result.success) {
        showToast('Registration successful! Redirecting...', 'success', 3000);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(result.error || 'Registration failed');
        showToast(result.error || 'Registration failed', 'error', 5000);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Registration failed';
      setError(errorMsg);
      showToast(errorMsg, 'error', 5000);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Edumentry</h2>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Start Your Learning Journey Today
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join thousands of learners and unlock your potential with our comprehensive learning management system. Get access to expert courses and track your progress.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-white/90">Access to expert-led courses</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-white/90">Personalized learning paths</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-white/90">Connect with a community of learners</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Edumentry</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center ${step === 'role' ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'role' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Select Role</span>
                </div>
                <div className={`flex-1 h-0.5 mx-4 ${step !== 'role' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center ${step === 'otp' || step === 'details' ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'otp' || step === 'details' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Verify Email</span>
                </div>
                <div className={`flex-1 h-0.5 mx-4 ${step === 'details' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center ${step === 'details' ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">Complete</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Join us and start your learning journey today</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 1: Role Selection */}
            {step === 'role' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    I want to register as:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('student')}
                      className={`p-6 border-2 rounded-lg text-left transition-all ${
                        selectedRole === 'student'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <GraduationCap className={`w-6 h-6 ${selectedRole === 'student' ? 'text-primary' : 'text-gray-400'}`} />
                        <h3 className="font-semibold text-gray-900">Student</h3>
                      </div>
                      <p className="text-sm text-gray-600">Join as a student to enroll in courses and track your learning progress</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('organization')}
                      className={`p-6 border-2 rounded-lg text-left transition-all ${
                        selectedRole === 'organization'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className={`w-6 h-6 ${selectedRole === 'organization' ? 'text-primary' : 'text-gray-400'}`} />
                        <h3 className="font-semibold text-gray-900">Organization</h3>
                      </div>
                      <p className="text-sm text-gray-600">Register your organization to manage courses, tutors, and students</p>
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="you@example.com"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email?.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={!selectedRole || !emailValue || sendingOTP}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {sendingOTP ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Verification code sent!</strong> Please check your email <strong>{registrationEmail}</strong> for the 6-digit OTP code.
                  </p>
                </div>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('role');
                      setOtpCode('');
                      setOtpSent(false);
                    }}
                    className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpCode.length !== 6 || verifyingOTP}
                    className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {verifyingOTP ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={sendingOTP}
                  className="w-full text-sm text-primary hover:text-primary-600 disabled:opacity-50"
                >
                  {sendingOTP ? 'Resending...' : "Didn't receive code? Resend"}
                </button>
              </motion.div>
            )}

            {/* Step 3: Complete Registration */}
            {step === 'details' && (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800">Email verified! Please complete your registration details.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="firstName"
                        type="text"
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          errors.firstName
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        placeholder="John"
                        {...register("firstName")}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.firstName?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="lastName"
                        type="text"
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          errors.lastName
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        placeholder="Doe"
                        {...register("lastName")}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.lastName?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          errors.password
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        placeholder="Create a password"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          errors.confirmPassword
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        placeholder="Confirm your password"
                        {...register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.confirmPassword?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                      {...register("acceptTerms")}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-700 cursor-pointer">
                      I accept the{" "}
                      <Link href="/terms" className="font-medium text-primary hover:text-primary-600 transition-colors">
                        terms
                      </Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="font-medium text-primary hover:text-primary-600 transition-colors">
                        privacy policy
                      </Link>
                    </label>
                  </div>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.acceptTerms?.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create account
                    </>
                  )}
                </button>
              </motion.form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

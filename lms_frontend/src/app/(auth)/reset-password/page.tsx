"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
    }
  }, [token]);

  const onSubmit = async (values: ResetPasswordInput) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setError(null);
    
    const result = await resetPassword({
      token,
      password: values.password,
    });

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.error || 'Failed to reset password');
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="w-full max-w-md">
          <div className="card shadow-xl">
            <div className="card-header text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="card-title">Invalid reset link</h1>
              <p className="card-description">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <div className="card-footer justify-center">
              <Link href="/forgot-password" className="btn btn-primary">
                Request new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="w-full max-w-md">
          <div className="card shadow-xl">
            <div className="card-header text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="card-title">Password reset successful</h1>
              <p className="card-description">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>
            <div className="card-footer justify-center">
              <Link href="/login" className="btn btn-primary">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md">
        <div className="card shadow-xl">
          <div className="card-header text-center">
            <h1 className="card-title">Reset your password</h1>
            <p className="card-description">
              Enter your new password below.
            </p>
          </div>
          <div className="card-content">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="form-label">New Password</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder="Enter your new password"
                  {...register("password")} 
                />
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="form-label">Confirm New Password</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder="Confirm your new password"
                  {...register("confirmPassword")} 
                />
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword.message}</p>
                )}
              </div>
              <button className="btn btn-primary w-full py-3" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </div>
          <div className="card-footer justify-center">
            <p className="text-sm text-muted-foreground">
              Remember your password? <Link href="/login" className="text-primary hover:text-primary-600 transition-colors font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

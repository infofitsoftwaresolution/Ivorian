"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState } from "react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setError(null);
    
    const result = await forgotPassword({
      email: values.email,
    });

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
  };

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
              <h1 className="card-title">Check your email</h1>
              <p className="card-description">
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>
            </div>
            <div className="card-footer justify-center">
              <Link href="/login" className="btn btn-primary">
                Back to sign in
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
            <h1 className="card-title">Forgot your password?</h1>
            <p className="card-description">
              Enter your email address and we'll send you a link to reset your password.
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
                <label className="form-label">Email address</label>
                <input 
                  className="input" 
                  type="email" 
                  placeholder="Enter your email"
                  {...register("email")} 
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>
              <button className="btn btn-primary w-full py-3" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send reset link"}
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

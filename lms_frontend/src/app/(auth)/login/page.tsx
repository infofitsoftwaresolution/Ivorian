"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInput, loginSchema } from "@/lib/validators/auth";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Fix hydration error by ensuring component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated (only once)
  useEffect(() => {
    if (mounted && isAuthenticated && !isRedirecting) {
      console.log('User already authenticated, redirecting to dashboard...');
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [mounted, isAuthenticated, router, isRedirecting]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setError(null);
    
    console.log('Attempting login with:', values.email);
    
    const result = await login({
      email: values.email,
      password: values.password,
    });

    console.log('Login result:', result);

    if (result.success) {
      console.log('Login successful, redirecting to dashboard...');
      setIsRedirecting(true);
      router.push('/dashboard');
    } else {
      console.error('Login failed:', result.error);
      setError(result.error || 'Login failed');
    }
  };

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md">
        <div className="card shadow-xl">
          <div className="card-header text-center">
            <h1 className="card-title">Sign in to your account</h1>
            <p className="card-description">Welcome back! Please enter your details.</p>
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
              <div>
                <label className="form-label">Password</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder="Enter your password"
                  {...register("password")} 
                />
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input id="remember" type="checkbox" className="rounded border-input" />
                  <label htmlFor="remember" className="text-sm text-muted-foreground">Remember me</label>
                </div>
                <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <button className="btn btn-primary w-full py-3" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
          <div className="card-footer justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account? <Link href="/register" className="text-primary hover:text-primary-600 transition-colors font-medium">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

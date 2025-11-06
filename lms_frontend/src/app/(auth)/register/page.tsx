"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterInput, registerSchema } from "@/lib/validators/auth";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    setError(null);
    
    console.log('Submitting registration with values:', values);
    
    const result = await registerUser({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      acceptTerms: values.acceptTerms,
    });

    console.log('Registration result:', result);

    if (result.success) {
      // Redirect to dashboard after successful registration
      console.log('Registration successful, redirecting to dashboard...');
      router.push('/dashboard');
    } else {
      console.error('Registration failed:', result.error);
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-8">
      <div className="w-full max-w-lg">
        <div className="card shadow-xl">
          <div className="card-header text-center">
            <h1 className="card-title">Create your account</h1>
            <p className="card-description">Join us and start your learning journey today.</p>
          </div>
          <div className="card-content">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First name</label>
                  <input 
                    className="input" 
                    placeholder="Enter your first name"
                    {...register("firstName")} 
                  />
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Last name</label>
                  <input 
                    className="input" 
                    placeholder="Enter your last name"
                    {...register("lastName")} 
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Password</label>
                  <input 
                    className="input" 
                    type="password" 
                    placeholder="Create a password"
                    {...register("password")} 
                  />
                  {errors.password && (
                    <p className="form-error">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Confirm Password</label>
                  <input 
                    className="input" 
                    type="password" 
                    placeholder="Confirm your password"
                    {...register("confirmPassword")} 
                  />
                  {errors.confirmPassword && (
                    <p className="form-error">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <input 
                  id="terms" 
                  type="checkbox" 
                  className="rounded border-input mt-1" 
                  {...register("acceptTerms")} 
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  I accept the <Link href="/terms" className="text-primary hover:text-primary-600 transition-colors">terms</Link> and <Link href="/privacy" className="text-primary hover:text-primary-600 transition-colors">privacy policy</Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="form-error">{errors.acceptTerms.message}</p>
              )}
              <button className="btn btn-primary w-full py-3" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>
          </div>
          <div className="card-footer justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:text-primary-600 transition-colors font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { LoginForm } from "@/features/authentication/components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
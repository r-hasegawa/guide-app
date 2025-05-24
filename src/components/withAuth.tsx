"use client"
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEffect, ComponentType } from "react";

export function withAuth<P extends Record<string, any>>(WrappedComponent: ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { user, loading } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace("/login");
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return <div>読み込み中...</div>;
    }

    return <WrappedComponent {...props} />;
  };
}
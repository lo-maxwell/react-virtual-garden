'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../hooks/contexts/AuthContext";

const TestPage = () => {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) router.push("/signin");
  }, [firebaseUser, loading, router]);

  if (loading) return <p>Loading...</p>;

  return <div>Protected Content for Authenticated Users Only</div>;
}

export default TestPage;
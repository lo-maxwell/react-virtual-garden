'use client'
import { useRouter } from "@/node_modules/next/navigation";
import { useEffect } from "react";

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/garden');
  }, [router]);

  return (
    <div> This is the Home Page!
    </div>
  );
}

export default HomePage;
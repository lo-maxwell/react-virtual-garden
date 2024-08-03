'use client'
import { useRouter } from "@/node_modules/next/navigation";
import { useEffect } from "react";

const HomePage = () => {
  const router = useRouter();

  // useEffect(() => {
  //   router.replace('/garden');
  // }, [router]);

  return (
    <div className="flex flex-1 bg-reno-sand-200 text-black"> This is the Home Page!
    </div>
  );
}

export default HomePage;
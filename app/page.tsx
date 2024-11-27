'use client'
import { useRouter } from "@/node_modules/next/navigation";
import Link from "next/link";
import { useEffect } from "react";

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    // router.replace('/garden');
  }, [router]);

  return (
    <>
      <div className="flex flex-1 flex-col bg-reno-sand-200 text-black"> 
      <div className="mx-4 mb-4">The home page isn&apos;t done yet! Check out these other pages in the meantime.</div>
      <div className="mx-4 ">
        <Link
          href={"/garden"}
        >
        <p className="inline-block">Go to Garden Page</p>
        </Link>
      </div>
      <div className="mx-4">
        <Link
          href={"/store"}
        >
        <p className="inline-block">Go to Store Page</p>
        </Link>
      </div>
      <div className="mx-4">
        <Link
          href={"/user"}
        >
        <p className="inline-block">Go to User Page</p>
        </Link>
      </div>
      <div className="mx-4">
        <Link
          href={"/login"}
        >
        <p className="inline-block">Go to Login Page</p>
        </Link>
      </div>
      </div>
    </>
  );
}

export default HomePage;
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/contexts/AuthContext";
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import "./page.css";

const HomePage = () => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { guestMode } = useAccount();

  const handlePlayNow = () => {
    if (firebaseUser || guestMode) {
      router.push("/garden");
    } else {
      router.push("/login");
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col bg-reno-sand-200 text-black">
        <div className="flex-1 relative w-full h-full">
          <img
            src="/assets/home/gooseBanner.svg"
            alt="Goose Banner"
            className="w-full h-full object-cover desktop-banner"
          />

          <img
            src="/assets/home/gooseBannerMobile.svg"
            alt="Goose Banner Mobile"
            className="hero-image mobile-banner"
          />

          <div className="absolute top-[30%] left-[70%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center text-black text-8xl font-extrabold drop-shadow-lg select-none pointer-events-none whitespace-nowrap hero-overlay">
            Goose Farm
            <button
              onClick={handlePlayNow}
              className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-black text-3xl font-bold rounded-lg shadow-lg transition-colors duration-200 mt-4 pointer-events-auto select-auto"
              type="button"
            >
              Play Now
            </button>
          </div>
        </div>
        <p className="mx-4 my-4 text-2xl font-normal text-black pointer-events-auto select-auto">
          Check us out on{" "}
          <a
            href="https://github.com/lo-maxwell/react-virtual-garden/blob/main/design-doc.md"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-2xl text-blue-600 underline pointer-events-auto select-auto"
          >
            Github
          </a>
          .
        </p>
        {/* <div className="mx-4 ">
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
        </div> */}
      </div>
    </>
  );
};

export default HomePage;

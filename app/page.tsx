"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/contexts/AuthContext";
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import "./page.css";
import { useCallback, useMemo } from "react";

const HomePage = () => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { guestMode } = useAccount();

  const playNowUrl = useMemo(() => {
    return firebaseUser || guestMode ? "/garden" : "/login";
  }, [firebaseUser, guestMode]);

  const handlePlayNowClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      e.preventDefault(); // prevent default full page reload
      router.push(playNowUrl); // client-side navigation
    },
    [playNowUrl, router]
  );

  const homeOverlay = useMemo(() => (
    <div className="absolute top-[30%] left-[70%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center text-black text-8xl font-extrabold drop-shadow-lg select-none whitespace-nowrap hero-overlay">
      Goose Farm
      <a
        href={playNowUrl} // visible URL, supports right-click, new tab, etc.
        onClick={handlePlayNowClick} // still use client-side routing
        className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-black text-3xl font-bold rounded-lg shadow-lg transition-colors duration-200 mt-4 select-auto"
      >
        Play Now
      </a>
    </div>
  ), [handlePlayNowClick, playNowUrl]);

  // Memoized banner images
  const homeImages = useMemo(() => (
    <>
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
    </>
  ), []);

  return (
    <div className="flex flex-1 flex-col bg-reno-sand-200 text-black">
      <div className="flex-1 relative w-full h-full">
        {homeImages}
        {homeOverlay}
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
    </div>
  );
};

export default HomePage;

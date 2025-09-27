"use client";
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { useAuth } from "@/app/hooks/contexts/AuthContext";
import Link from "@/node_modules/next/link";
import { useEffect, useRef, useState } from "react";
import ProfileDisplay from "./profileDisplay";
import ProfileMenu from "./profileMenu";
import useClickOutside from "@/app/hooks/common/useClickOutside";
import { usePathname } from "next/navigation";
import "./header.css";

export default function Header() {
  const linkStyle = `text-gray-800 hover:text-blue-600 hover:underline transition-colors duration-200`;
  const activeLinkStyle = `text-blue-600 font-semibold underline`;
  const [isOpen, setIsOpen] = useState(false);
  const { firebaseUser } = useAuth();
  const { guestMode } = useAccount();
  const pathname = usePathname();

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useClickOutside([menuRef, buttonRef], () => setIsOpen(false));

  const toggleMenu = () => setIsOpen(!isOpen);

  // Hamburger menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleHamMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 430);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial value
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getLinkStyle = (path: string) => {
    return isActive(path) ? activeLinkStyle : linkStyle;
  };

  const renderLinkOptions = () => {
    const sharedLinks = (
      <>
        <Link
          href="/garden"
          className={getLinkStyle("/garden")}
          onClick={closeMenu}
        >
          Garden
        </Link>
        <Link
          href="/store"
          className={getLinkStyle("/store")}
          onClick={closeMenu}
        >
          Store
        </Link>
        <Link
          href="/user"
          className={getLinkStyle("/user")}
          onClick={closeMenu}
        >
          User
        </Link>
      </>
    );

    if (firebaseUser || guestMode) {
      return (
        <>
          {sharedLinks}
          {guestMode && (
            <Link
              href="/login"
              className={getLinkStyle("/login")}
              onClick={closeMenu}
            >
              Login
            </Link>
          )}
          {!isMobile && (firebaseUser || guestMode) && (
            <button ref={buttonRef} onClick={toggleMenu} className="text-black">
              <ProfileDisplay isOpen={isOpen} />
            </button>
          )}
        </>
      );
    } else {
      return (
        <Link
          href="/login"
          className={getLinkStyle("/login")}
          onClick={closeMenu}
        >
          Login
        </Link>
      );
    }
  };

  return (
    <header className="bg-blue-200 sticky top-0 z-10 w-full items-center justify-between">
      <nav className="w-full">
        <div className="flex items-center justify-between w-full px-4 py-3">
          {/* Name Button */}
          <div className="flex-shrink-0">
            <div className="text-2xl font-bold text-black">Goose Farm</div>
          </div>

          <div className="flex items-center space-x-4">
            {guestMode && (
              <div
                className={"text-red-600 items-center"}
              >{`[Guest Mode]`}</div>
            )}
            <div className="mobile-nav flex items-center">
              {isMobile && (firebaseUser || guestMode) && (
                <button ref={buttonRef} onClick={toggleMenu} className="text-black px-4">
                  <ProfileDisplay isOpen={isOpen} />
                </button>
              )}

              <button className="menu-toggle" onClick={toggleHamMenu}>
                ☰
              </button>
              <div
                className={`nav-links items-center ${isMenuOpen ? "open" : ""}`}
              >
                <Link
                  href="/"
                  className={getLinkStyle("/")}
                  onClick={closeMenu}
                >
                  Home
                </Link>
                {renderLinkOptions()}
              </div>

              <div className="profile-menu">
                <ProfileMenu
                  menuRef={menuRef}
                  isOpen={isOpen}
                  toggleMenu={toggleMenu}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

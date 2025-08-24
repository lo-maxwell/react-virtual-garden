'use client';
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { useAuth } from "@/app/hooks/contexts/AuthContext";
import Link from "@/node_modules/next/link";
import { useEffect, useRef, useState } from "react";
import ProfileDisplay from "./profileDisplay";
import ProfileMenu from "./profileMenu";
import useClickOutside from "@/app/hooks/common/useClickOutside";
import { usePathname } from "next/navigation";

export default function Header () {
	const linkStyle = `text-gray-800 hover:text-blue-600 hover:underline transition-colors duration-200`
	const activeLinkStyle = `text-blue-600 font-semibold underline`
	const [isOpen, setIsOpen] = useState(false);
	const { firebaseUser } = useAuth();
	const { guestMode } = useAccount();
	const pathname = usePathname();

	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	useClickOutside([menuRef, buttonRef], () => setIsOpen(false));
  
	const toggleMenu = () => setIsOpen(!isOpen);

	const isActive = (path: string) => {
		return pathname === path;
	};

	const getLinkStyle = (path: string) => {
		return isActive(path) ? activeLinkStyle : linkStyle;
	};

	const renderLinkOptions = () => {
		const sharedLinks = (
		  <>
			<Link href="/garden" className={getLinkStyle("/garden")}>Garden</Link>
			<Link href="/store" className={getLinkStyle("/store")}>Store</Link>
			<Link href="/user" className={getLinkStyle("/user")}>User</Link>
		  </>
		);
	  
		if (firebaseUser || guestMode) {
		  return (
			<>
			  {sharedLinks}
			  {guestMode && <Link href="/login" className={getLinkStyle("/login")}>Login</Link>}
			  <button ref={buttonRef} onClick={toggleMenu} className="text-black">
				<ProfileDisplay isOpen={isOpen} />
			  </button>
			</>
		  );
		} else {
		  return <Link href="/login" className={getLinkStyle("/login")}>Login</Link>;
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
					{guestMode && <div className={"text-red-600"}>{`[Guest Mode]`}</div>}
					<Link href="/" className={getLinkStyle("/")}>Home</Link>
					{renderLinkOptions()}
				</div>
				<ProfileMenu menuRef={menuRef} isOpen={isOpen} toggleMenu={toggleMenu}/>
			</div>
		  </nav>
		</header>
	  );
}
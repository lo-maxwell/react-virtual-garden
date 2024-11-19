'use client';
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { useAuth } from "@/app/hooks/contexts/AuthContext";
import Link from "@/node_modules/next/link";
import { useState } from "react";
import ProfileDisplay from "./profileDisplay";
import ProfileMenu from "./profileMenu";

export default function Header () {
	const linkStyle = `text-gray-800`
	const [isOpen, setIsOpen] = useState(false);
	const { firebaseUser } = useAuth();
	const { guestMode } = useAccount();
  
	const toggleMenu = () => setIsOpen(!isOpen);

	const renderLinkOptions = () => {
		const sharedLinks = (
		  <>
			<Link href="/garden" className={linkStyle}>Garden</Link>
			<Link href="/store" className={linkStyle}>Store</Link>
			<Link href="/user" className={linkStyle}>User</Link>
		  </>
		);
	  
		if (firebaseUser || guestMode) {
		  return (
			<>
			  {sharedLinks}
			  {guestMode && <Link href="/login" className={linkStyle}>Login</Link>}
			  <button onClick={toggleMenu} className="text-black">
				<ProfileDisplay isOpen={isOpen} />
			  </button>
			</>
		  );
		} else {
		  return <Link href="/login" className={linkStyle}>Login</Link>;
		}
	  };

	return (
		<header className="bg-blue-200 sticky top-0 z-10 min-h-[72px] w-full flex items-center justify-between">
		  <nav className="w-full">
			<div className="flex items-center justify-between w-full px-4 py-4">
				{/* Name Button */}
				<div className="flex-shrink-0">
					<div className="text-2xl font-bold text-black">Virtual Garden</div>
				</div>
				<div className="flex items-center space-x-4">
					{guestMode && <div className={"text-red-600"}>{`[Guest Mode]`}</div>}
					<Link href="/" className={linkStyle}>Home</Link>
					{renderLinkOptions()}
				</div>
				<ProfileMenu isOpen={isOpen} toggleMenu={toggleMenu}/>
			</div>
		  </nav>
		</header>
	  );
}
import useClickOutside from "@/app/hooks/common/useClickOutside";
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { useAuth } from "@/app/hooks/contexts/AuthContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { useRef } from "react";

const ProfileMenu = ({isOpen, toggleMenu, menuRef}: {isOpen: boolean, toggleMenu: () => void, menuRef: React.RefObject<HTMLDivElement>}) => {
	const { user } = useUser();
	const { firebaseUser, logout } = useAuth();
	const { guestMode } = useAccount();

	if (!firebaseUser && !guestMode) {
		return <></>;
	}

	const testClick = () => console.log('test');
	const handleLogout = () => {
		logout();
		toggleMenu();
	}
	const getLogoutButtonText = () => {
		if (firebaseUser) return "Sign Out";
		return "Error";
	}

	return <>
		{isOpen && (
			<div ref={menuRef} className="absolute right-0 top-[70px] mr-2 bg-[#e0dedc] text-black rounded-lg shadow-lg p-2 w-max">
				<div className="block w-full text-left text-xl py-2 px-4 whitespace-nowrap">{user.getUsername()}</div>
				<button onClick={testClick} className="block w-full text-left py-2 px-4 hover:bg-[#d0cecc] whitespace-nowrap">Manage Account</button>
				
				{ (firebaseUser && 
					<button onClick={handleLogout} className="block w-full text-left py-2 px-4 hover:bg-[#d0cecc] whitespace-nowrap">{getLogoutButtonText()}</button>
				)
				}
				</div>
		)}
	</>
}

export default ProfileMenu;
import { useUser } from "@/hooks/contexts/UserContext";
import { iconRepository } from "@/models/user/icons/IconRepository";
import LevelSystemComponent from "../level/LevelSystem";

const UserProfileComponent = () => {
	const { user } = useUser();



	return <>
	<div className="flex flex-row items-center justify-center">
		<span className="border border-2 border-coffee-700 text-center bg-gray-300 min-w-12 min-h-12 text-3xl text-purple-600 font-semibold rounded-lg">{iconRepository.getIconByName(user.getIcon())}</span>
		<span className="ml-4 text-3xl">{user.getUsername()}</span>
	</div>
	<div className="mx-4 my-4"><LevelSystemComponent level={user.getLevel()} currentExp={user.getCurrentExp()} expToLevelUp={user.getExpToLevelUp()} /></div>
	</>
}

export default UserProfileComponent;
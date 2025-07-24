import { useUser } from "@/app/hooks/contexts/UserContext";
import IconDisplay from "../user/icon/IconDisplay";

const ProfileDisplay = ({isOpen}: {isOpen: boolean}) => {
	const { user } = useUser();

	const getBgColor = () => {
		if (isOpen) {
			return "apple-300";
		}
		return "gray-300";
	}

	

	return <>
		<div className="flex flex-row items-center justify-center">
		<IconDisplay icon={user.getIcon()} bgColor={getBgColor()} borderColor={`coffee-700`} textSize={"text-2xl"} elementSize={"9"}/>
		</div>
	</>
}

export default ProfileDisplay;
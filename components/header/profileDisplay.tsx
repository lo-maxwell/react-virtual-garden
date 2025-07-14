import { useUser } from "@/app/hooks/contexts/UserContext";
import { IconSVGFactory, iconSVGFactory } from "@/models/user/icons/IconSVGFactory";
import colors from "../colors/colors";
import IconDisplay from "../user/icon/IconDisplay";
import IconSVGDisplay from "../user/icon/IconSVGDisplay";

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
			{/* <IconDisplay icon={user.getIcon()} bgColor={getBgColor()} borderColor={`coffee-700`} textSize={"text-2xl"} elementSize={"9"}/> */}
			<IconSVGDisplay icon={IconSVGFactory.getDefaultErrorIcon().getName()} bgColor={getBgColor()} borderColor={`coffee-700`} textSize={"text-2xl"} elementSize={"9"}/>
		</div>
	</>
}

export default ProfileDisplay;
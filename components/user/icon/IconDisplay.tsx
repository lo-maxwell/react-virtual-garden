import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { iconFactory } from "@/models/user/icons/IconFactory";
import IconEmojiDisplay from "./IconEmojiDisplay";
import IconSVGDisplay from "./IconSVGDisplay";

const IconDisplay = ({icon, bgColor, borderColor, textSize, elementSize}: {icon: string, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	const {displayEmojiIcons} = useAccount();
	return <>
		{displayEmojiIcons ? 
		<IconEmojiDisplay icon={icon} bgColor={bgColor} borderColor={borderColor} textSize={textSize} elementSize={elementSize}/> : 
		<IconSVGDisplay icon={icon} bgColor={bgColor} borderColor={borderColor} textSize={textSize} elementSize={elementSize}/> 
		}
	  </>;

}

export default IconDisplay;
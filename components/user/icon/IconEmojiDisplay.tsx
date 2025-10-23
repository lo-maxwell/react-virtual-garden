import { useUser } from "@/app/hooks/contexts/UserContext";
import { iconEmojiFactory } from "@/models/user/icons/IconEmojiFactory";
import RawIconDisplay from "./RawIconDisplay";

const IconEmojiDisplay = ({icon, bgColor, borderColor, textSize, elementSize}: {icon: string, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
		<div className={`inline-flex ${borderColor} text-center ${bgColor} font-semibold rounded-lg aspect-square ${textSize} w-${elementSize} h-${elementSize} px-1 py-1 items-center justify-center`}>
			<RawIconDisplay icon={icon} width={elementSize} height={elementSize} />
		</div>
	);

}

export default IconEmojiDisplay;
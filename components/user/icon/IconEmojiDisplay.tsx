import { useUser } from "@/app/hooks/contexts/UserContext";
import { iconFactory } from "@/models/user/icons/IconFactory";
import RawIconDisplay from "./RawIconDisplay";

const IconEmojiDisplay = ({icon, bgColor, borderColor, textSize, elementSize}: {icon: string, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
		<span
		className={`inline-flex border border-2 border-${borderColor} text-center bg-${bgColor} font-semibold rounded-lg aspect-square ${textSize} w-${elementSize} h-${elementSize} px-1 py-1 flex items-center justify-center`}>
		<span className="inset-0 flex items-center justify-center">
		  <RawIconDisplay icon={icon} width={elementSize} height={elementSize} />
		</span>
	  </span>
	);

}

export default IconEmojiDisplay;
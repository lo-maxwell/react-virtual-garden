import { iconSVGFactory } from "@/models/user/icons/IconSVGFactory";
import RawIconDisplay from "./RawIconDisplay";


const IconSVGDisplay = ({icon, bgColor, borderColor, textSize, elementSize}: {icon: string, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
		<span
		className={`inline-flex ${borderColor} text-center ${bgColor} font-semibold rounded-lg aspect-square ${textSize} w-${elementSize} h-${elementSize} px-1 py-1 flex items-center justify-center`}>
		<span className="inset-0 flex items-center justify-center">
			<RawIconDisplay icon={icon} width={"full"} height={"full"} />
		</span>
	  </span>
	);

}

export default IconSVGDisplay;
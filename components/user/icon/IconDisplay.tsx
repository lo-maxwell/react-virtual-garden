import { useUser } from "@/app/hooks/contexts/UserContext";
import { iconFactory } from "@/models/user/icons/IconRepository";

const IconDisplay = ({icon, bgColor, borderColor, textSize, elementSize}: {icon: string, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
		<span
		className={`inline-flex border border-2 border-${borderColor} text-center bg-${bgColor} text-purple-600 font-semibold rounded-lg aspect-square ${textSize} min-w-${elementSize} min-h-${elementSize} px-1 py-1 flex items-center justify-center`}>
		<span className="inset-0 flex items-center justify-center">
		  {iconFactory.getIconByName(icon)}
		</span>
	  </span>
	);

}

export default IconDisplay;
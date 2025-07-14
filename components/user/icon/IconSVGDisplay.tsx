import { iconSVGFactory } from "@/models/user/icons/IconSVGFactory";


const IconSVGDisplay = ({icon, bgColor, borderColor, textSize, elementSize}: {icon: string, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
		<span
		className={`inline-flex border border-2 border-${borderColor} text-center bg-${bgColor} font-semibold rounded-lg aspect-square ${textSize} w-${elementSize} h-${elementSize} px-1 py-1 flex items-center justify-center`}>
		<span className="inset-0 flex items-center justify-center">
			<img src={`${iconSVGFactory.getIconByName(icon)}`} alt={icon} className="w-full h-full object-contain" />
		</span>
	  </span>
	);

}

export default IconSVGDisplay;
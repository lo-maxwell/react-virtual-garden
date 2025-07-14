import { MouseEventHandler } from "react";
import IconSVGDisplay from "./IconSVGDisplay";

const IconSVGButton = ({icon, onClickFunction, bgColor, borderColor, textSize, elementSize}: {icon: string, onClickFunction: MouseEventHandler<HTMLButtonElement>, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
	<button onClick={onClickFunction} className={`mx-2`}>
		<IconSVGDisplay icon={icon} bgColor={bgColor} borderColor={borderColor} textSize={textSize} elementSize={elementSize}/>
	</button>
	);

}

export default IconSVGButton;
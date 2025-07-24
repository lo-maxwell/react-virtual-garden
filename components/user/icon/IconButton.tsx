import { MouseEventHandler } from "react";
import IconDisplay from "./IconDisplay";

const IconButton = ({icon, onClickFunction, bgColor, borderColor, textSize, elementSize}: {icon: string, onClickFunction: MouseEventHandler<HTMLButtonElement>, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
	<button onClick={onClickFunction} className={``}>
		<IconDisplay icon={icon} bgColor={bgColor} borderColor={borderColor} textSize={textSize} elementSize={elementSize}/>
	</button>
	);

}

export default IconButton;
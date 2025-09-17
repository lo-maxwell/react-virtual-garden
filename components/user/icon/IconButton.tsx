import { MouseEventHandler } from "react";
import IconDisplay from "./IconDisplay";

const IconButton = ({icon, onClickFunction, bgColor, borderColor, textSize, elementSize, disabled}: {icon: string, onClickFunction: MouseEventHandler<HTMLButtonElement>, bgColor: string, borderColor: string, textSize: string, elementSize: string, disabled?: boolean}) => {
	
	return (
	<button onClick={onClickFunction} className={``} disabled={disabled}>
		<IconDisplay icon={icon} bgColor={bgColor} borderColor={borderColor} textSize={textSize} elementSize={elementSize}/>
	</button>
	);

}

export default IconButton;
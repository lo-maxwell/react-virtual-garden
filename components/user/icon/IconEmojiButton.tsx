import { MouseEventHandler } from "react";
import IconDisplay from "./IconDisplay";
import IconEmojiDisplay from "./IconEmojiDisplay";

const IconEmojiButton = ({icon, onClickFunction, bgColor, borderColor, textSize, elementSize}: {icon: string, onClickFunction: MouseEventHandler<HTMLButtonElement>, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
	<button onClick={onClickFunction} className={``}>
		<IconEmojiDisplay icon={icon} bgColor={bgColor} borderColor={borderColor} textSize={textSize} elementSize={elementSize}/>
	</button>
	);

}

export default IconEmojiButton;
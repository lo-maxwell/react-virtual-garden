import { MouseEventHandler } from "react";
import IconDisplay from "./IconDisplay";

const IconButton = ({icon, onClickFunction, size}: {icon: string, onClickFunction: MouseEventHandler<HTMLButtonElement>, size: string}) => {
	
	
	return (
	<button onClick={onClickFunction} className={`mx-2`}>
		<IconDisplay icon={icon} size={size}/>
	</button>
	);

}

export default IconButton;
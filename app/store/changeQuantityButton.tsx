import LongPressButton from "@/components/buttons/longPressButton";
import { useCallback, useState } from "react";

const ChangeQuantityButton = ({onClick, currentQuantity, className, contents}: {onClick: (arg: number) => void, currentQuantity: number, className: string, contents: JSX.Element}) => {
	const [timeElapsed, setTimeElapsed] = useState(0);

	const handleClick = useCallback(() => {
		onClick(1);
		setTimeElapsed(0);
	  }, [onClick]);


	const handleLongPress = useCallback(() => {
		// Handle quantity update based on the currentQuantity
		onClick(Math.max(2, Math.floor(1.1 ** timeElapsed)));
		setTimeElapsed((timeElapsed) => timeElapsed + 1);
	  }, [onClick, timeElapsed]);

	return <LongPressButton 
		onClick={handleClick} 
		onLongPress={handleLongPress} 
		onLongPressEnd={() => {setTimeElapsed(0)}}
		className={className} 
		contents={contents}/>
}

export default ChangeQuantityButton;

import LongPressButton from "@/components/buttons/longPressButton";
import { useCallback, useState } from "react";

const ChangeQuantityButton = ({ onClick, currentQuantity, className, contents }: { onClick: (arg: number) => void, currentQuantity: number, className: string, contents: JSX.Element }) => {
	//Bugs can probably be fixed by marking date.now as initial time and recalculating handleLongPress dynamically
	const [pressTicks, setPressTicks] = useState(0);

	const handleClick = useCallback(() => {
		onClick(1);
		setPressTicks(0);
	}, [onClick]);

	const handleLongPress = useCallback(() => {
	  
		setPressTicks((prev) => {
		  const next = prev + 1;
	  
		  let increment;
		  if (next <= 10) {
			// First 10 ticks → strictly +1 each time
			increment = 1;
		  } else {
			// After that → exponential growth
			increment = Math.floor(1.2 ** (next - 10));
		  }
	  
		  onClick(increment);
		  return next;
		});
	  }, [onClick]);
	  

	const handleLongPressEnd = useCallback(() => {
		setPressTicks(0);
	}, []);

	return (
		<LongPressButton
			onClick={handleClick}
			onLongPress={handleLongPress}
			onLongPressEnd={handleLongPressEnd}
			className={className}
			contents={contents}
		/>
	);
}

export default ChangeQuantityButton;

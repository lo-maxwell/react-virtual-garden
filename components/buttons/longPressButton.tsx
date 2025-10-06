import React, { useState, useRef, MouseEvent, useCallback, useEffect } from 'react';

const LongPressButton = ({ onClick, onLongPress, onLongPressEnd, className, contents }: {onClick: Function, onLongPress: Function, onLongPressEnd: Function, className: string, contents: JSX.Element}) => {
	const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const onLongPressRef = useRef(onLongPress);
	useEffect(() => {
		onLongPressRef.current = onLongPress;
	}, [onLongPress]);

	useEffect(() => {
		return () => {
		  if (pressTimer) {
			onLongPressEnd();
			clearTimeout(pressTimer);
		  }
		  if (intervalRef.current) {
			clearInterval(intervalRef.current);
		  }
		};
	  }, [pressTimer]);

	const startPressTimer = useCallback(() => {
		if (pressTimer) {
			onLongPressEnd();
			// Type guard to check if pressTimer is a number
			clearTimeout(pressTimer as unknown as number);
		}
		if (intervalRef.current) {
			// Type guard to check if intervalRef.current is a number
			clearInterval(intervalRef.current as unknown as number);
		}

		const timer = setTimeout(() => {
			intervalRef.current = setInterval(() => {
				onLongPressRef.current();
			}, 100);
		}, 600); // Long press duration threshold
		setPressTimer(timer);
	}, [onLongPress]);

	const clearPressTimer = useCallback(() => {
		if (pressTimer) {
			onLongPressEnd();
			clearTimeout(pressTimer);
			setPressTimer(null);
		}
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, [pressTimer]);

	const handleMouseDown = useCallback(() => {
		startPressTimer();
	}, [startPressTimer]);

	const handleMouseUp = useCallback(() => {
		clearPressTimer();
	}, [clearPressTimer]);

	const handleClick = useCallback(() => {
		clearPressTimer();
		onClick();
	}, [onClick, clearPressTimer]);

	return (
		<button
		onMouseDown={handleMouseDown}
		onMouseUp={handleMouseUp}
		onMouseLeave={handleMouseUp}
		onClick={handleClick}
		className={className}
		>
		{contents}
		</button>
	);
};

export default LongPressButton;
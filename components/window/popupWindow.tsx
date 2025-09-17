import React, { useEffect } from 'react'

export function PopupWindow({children, showWindow, setShowWindow}: {children: React.ReactNode, showWindow: boolean, setShowWindow: Function}) {
	const handleClickOutside = (event: any) => {
		const target = event.target as HTMLElement;
		const configElement = document.querySelector('.children-window');
		// Check if the click occurred outside the target element
		if (configElement && !configElement.contains(target)) {
			setShowWindow(false);
		}
	  };

	useEffect(() => {
	// Add event listener when the component mounts
	document.body.addEventListener('click', handleClickOutside);

	// Remove event listener when the component unmounts
	return () => {
		document.body.removeEventListener('click', handleClickOutside);
	};
	}, [showWindow]); // Only re-run the effect if showWindow changes

	return (
		<span className={`${showWindow ? `` : `hidden`} fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50`}>
			<span className="children-window">
				{children}
			</span>
		</span>
	);
}
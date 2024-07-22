const SVGComponent = ({directions}: {directions: string}) => (
  
    <svg 
		className="w-full h-full"
		clipRule="evenodd" 
		fillRule="evenodd" 
		strokeLinejoin="round" 
		strokeMiterlimit="2" 
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d={directions} fill="currentColor" fillRule="nonzero"/>
	</svg>
);

export default SVGComponent;
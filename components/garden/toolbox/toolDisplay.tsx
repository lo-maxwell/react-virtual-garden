const ToolDisplay = ({icon, bgColor, borderColor, textSize, elementSize}: {icon: string, bgColor: string, borderColor: string, textSize: string, elementSize: string}) => {
	
	return (
		<span
		className={`hover:bg-purple-600 inline-flex border border-4 ${borderColor} text-center ${bgColor} text-purple-600 font-semibold rounded-lg aspect-square ${textSize} min-w-${elementSize} min-h-${elementSize} px-1 py-1 flex items-center justify-center`}>
		<span className="inset-0 flex items-center justify-center">
		  {icon}
		</span>
	  </span>
	);

}

export default ToolDisplay;
import { iconRepository } from "@/models/user/icons/IconRepository";

const IconDisplay = ({icon, size}: {icon: string, size: string}) => {
	return (
		<span
		className={`inline-flex border border-2 border-coffee-700 text-center bg-gray-300 text-purple-600 font-semibold rounded-lg aspect-square ${size} min-w-12 min-h-12 px-1 py-1 flex items-center justify-center`}>
		<span className="inset-0 flex items-center justify-center">
		  {iconRepository.getIconByName(icon)}
		</span>
	  </span>
	);

}

export default IconDisplay;
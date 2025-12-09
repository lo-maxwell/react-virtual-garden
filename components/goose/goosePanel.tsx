import CustomGooseSVG from "./customGooseSVG";

interface GoosePanelProps {
	goose: {
		id: string;
		name: string;
		color: string; // 6‑char hex
		birthday: string | Date;
		attributes: {
			power: number;
			charisma: number;
			mood: number;
			personality: string;
		};
	};
}

const GoosePanel: React.FC<GoosePanelProps> = ({ goose }) => {
	const color = `#${goose.color}`;
	const birthday = new Date(goose.birthday).toLocaleDateString(); // format as mm/dd/yyyy

	return (
		<div className="flex flex-col items-center p-4 rounded-2xl bg-apple-300 shadow-md w-full max-w-sm gap-4 h-96 text-black">
			<h2 className="text-xl font-semibold">{goose.name}</h2>

			<CustomGooseSVG bodyColor={color} style={{ width: 100, height: 200}}/>

			<div className="grid grid-cols-2 gap-2 w-full text-sm">
				<div className="p-2 rounded-xl bg-gray-100 text-center">Power: {goose.attributes.power}</div>
				<div className="p-2 rounded-xl bg-gray-100 text-center">Charisma: {goose.attributes.charisma}</div>
				<div className="p-2 rounded-xl bg-gray-100 text-center">Mood: {goose.attributes.mood}</div>
				<div className="p-2 rounded-xl bg-gray-100 text-center capitalize">{goose.attributes.personality}</div>
				<div className="p-2 rounded-xl bg-gray-100 text-center col-span-2">Birthday: {birthday}</div>
			</div>
		</div>
	);
};

export default GoosePanel;

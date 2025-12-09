import CustomGooseSVG from "./customGooseSVG";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { useGoose } from "@/app/hooks/contexts/GooseContext";
import { makeApiRequest } from "@/utils/api/api";
import { useUser } from "@/app/hooks/contexts/UserContext";

interface EditableGoosePanelProps {
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

const EditableGoosePanel: React.FC<EditableGoosePanelProps> = ({ goose }) => {
	const color = `#${goose.color}`;
	const birthday = new Date(goose.birthday).toLocaleDateString();
	const [isEditing, setIsEditing] = useState(false);
	const [nameInput, setNameInput] = useState(goose.name);
	const { guestMode } = useAccount();
	const { user } = useUser();
	const { goosePen, updateGooseName } = useGoose();

	// Sync nameInput with goose.name whenever goose changes
	useEffect(() => {
		setNameInput(goose.name);
	}, [goose.name]);

	const handleSave = () => {
		const trimmed = nameInput.trim();
		if (trimmed.length === 0 || trimmed.length > 32 || trimmed === goose.name) {
			setIsEditing(false);
			return;
		}
		onSaveName(trimmed);
		setIsEditing(false);
	};

	const onSaveName = useCallback(
		async (newGooseName: string) => {

			if (guestMode) return;

			try {
				const data = {
					newGooseName: newGooseName,
				};
				const result = await makeApiRequest(
					"PATCH",
					`/api/goose/${goosePen.getId()}/gooses/${goose.id}/rename`,
					data,
					true
				);
				if (result.success) {
					console.log("Successfully posted:", result.data);
					updateGooseName(goose.id, newGooseName);
				} else {
					console.error("Error posting username:", result.error);
				}
			} catch (error) {
				console.error(error);
			}
		},
		[guestMode, user, goosePen]
	);

	return (
		<div className="flex flex-col items-center p-4 rounded-2xl bg-apple-300 shadow-md w-full max-w-sm gap-4 h-96 text-black">
			{/* Name row with optional input */}
			<div className="flex items-center gap-2 w-full justify-center min-h-10">
				{isEditing ? (
					<input
						className="border px-2 py-1 rounded text-center w-32"
						value={nameInput}
						onChange={(e) => setNameInput(e.target.value)}
						autoFocus
					/>
				) : (
					<h2 className="text-xl font-semibold">{goose.name}</h2>
				)}
				<button
					className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
					onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
				>
					{isEditing ? "Save" : "Edit"}
				</button>
			</div>

			<CustomGooseSVG bodyColor={color} style={{ width: 100, height: 200 }} />

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

export default EditableGoosePanel;

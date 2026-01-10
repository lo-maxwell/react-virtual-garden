// components/goose/GooseAttributesGrid.tsx
import AttributeBox, { AttributeTooltip } from "./AttributeBox";

interface GooseAttributes {
	power: number;
	charisma: number;
	mood: number;
	personality: string;
  }
  
interface GooseAttributesGridProps {
	attributes: GooseAttributes;
	birthday: string; // already string-formatted date
}

export default function GooseAttributesGrid({ attributes, birthday }: GooseAttributesGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full text-sm">
      
      <AttributeBox
					label="Power"
					value={attributes.power}
					tooltip={
						<AttributeTooltip
							title="Power"
							description="Power increases your goose’s effectiveness in strength-based actions."
						/>
					}
				/>

				<AttributeBox
					label="Charisma"
					value={attributes.charisma}
					tooltip={
						<AttributeTooltip
							title="Charisma"
							description="Charisma enhances your goose’s charm and social interactions."
						/>
					}
				/>

				<AttributeBox
					label="Mood"
					value={attributes.mood}
					tooltip={
						<AttributeTooltip
							title="Mood"
							description="Mood affects how your goose behaves. Keeping them fed and happy improves mood."
						/>
					}
				/>

				<AttributeBox
					label="Personality"
					value={attributes.personality}
					hideLabel
					tooltip={
						<AttributeTooltip
							title="Personality"
							description="A goose’s personality defines its quirks, behavior, and special traits."
						/>
					}
					className="capitalize"
				/>

				{/* Birthday — full width */}
				<AttributeBox
					label="Birthday"
					value={birthday}
					tooltip={
						<AttributeTooltip
							title="Birthday"
							description="This is the day your goose was hatched."
							// extra={<div>Celebrate it every year for a mood bonus!</div>}
						/>
					}
					className="col-span-2"
				/>
    </div>
  );
}

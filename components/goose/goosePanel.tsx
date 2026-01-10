import colors from "../colors/colors";
import Tooltip from "../window/tooltip";
import CustomGooseSVG from "./customGooseSVG";
import GooseAttributesGrid from "./GooseAttributesGrid";

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

const AttributeTooltip: React.FC<{
    title: string;
    description?: string;
    extra?: React.ReactNode;
}> = ({ title, description, extra }) => {
    return (
        <div className="flex flex-col text-black min-w-0 max-w-xs" data-testid="goose-attr-tooltip">
            <div className="font-semibold text-lg mb-1">{title}</div>
            {description && <div className="text-sm mb-1">{description}</div>}
            {extra && <div className="text-sm">{extra}</div>}
        </div>
    );
};

const AttributeBox: React.FC<{
    label: string;
    value: React.ReactNode;
    tooltip: React.ReactNode;
    hideLabel?: boolean;
    className?: string;
}> = ({ label, value, tooltip, hideLabel = false, className = "" }) => (
    <Tooltip content={tooltip} backgroundColor="bg-gray-200" wrapperClassName={className}>
        <div className={`p-2 rounded-xl bg-gray-100 text-center cursor-help ${className}`}>
            {hideLabel ? value : (<>{label}: {value}</>)}
        </div>
    </Tooltip>
);

const GoosePanel: React.FC<GoosePanelProps> = ({ goose }) => {
	const color = `#${goose.color}`;
	const birthday = new Date(goose.birthday).toLocaleDateString(); // format as mm/dd/yyyy

	return (
		<div className={`flex flex-col items-center p-4 rounded-2xl shadow-md w-full max-w-sm gap-4 text-black ${colors.goose.panelBackgroundColor}`}>
			<h2 className="text-xl font-semibold">{goose.name}</h2>

			<CustomGooseSVG bodyColor={color} style={{ width: 100, height: 200}}/>

			<GooseAttributesGrid 
				attributes={goose.attributes}
				birthday={birthday}
			/>
		</div>
	);
};

export default GoosePanel;

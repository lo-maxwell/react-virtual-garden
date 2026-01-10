import Tooltip from "../window/tooltip";

export const AttributeTooltip: React.FC<{
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

export default AttributeBox;

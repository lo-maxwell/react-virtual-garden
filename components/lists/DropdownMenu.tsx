import React from 'react';

interface DropdownProps<T> {
    label: string;
    options: T[];
    selectedValue: T | null;
    onChange: (value: T | null) => void;
    renderOptionLabel: (option: T) => string; // Function to convert option to string for display
}

const DropdownMenu = <T,>({
    label,
    options,
    selectedValue,
    onChange,
    renderOptionLabel,
}: DropdownProps<T>) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        const selectedOption = options.find(option => renderOptionLabel(option) === value) || null;
        onChange(selectedOption);
    };

    return (
        <div className="flex flex-row justify-between">
            <label htmlFor="dropdown" className="mr-2">{label}</label>
            <select
                id="dropdown"
                value={selectedValue ? renderOptionLabel(selectedValue) : ''}
                onChange={handleChange}
            >
                <option value="">Select an option</option>
                {options.map((option) => (
                    <option key={renderOptionLabel(option)} value={renderOptionLabel(option)}>
                        {renderOptionLabel(option)}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DropdownMenu;
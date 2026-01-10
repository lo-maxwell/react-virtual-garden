import React from "react";

interface SettingsToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  checked,
  onChange,
}) => {
  return (
    <div className="mx-4 mt-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">{label}</span>
        <label className="cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only"
          />
          <div
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              checked ? "bg-green-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                checked ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
        </label>
      </div>
    </div>
  );
};

export default SettingsToggle;

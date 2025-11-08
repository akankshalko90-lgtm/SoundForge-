import React from 'react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, setEnabled }) => {
  return (
    <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <button
            type="button"
            className={`${
                enabled ? 'bg-purple-600' : 'bg-gray-600'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
        >
            <span
                aria-hidden="true"
                className={`${
                enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
  );
};

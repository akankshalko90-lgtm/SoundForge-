import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ label, value, onChange, disabled = false }) => {
  return (
    <div className={`flex items-center space-x-4 text-gray-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <label className="w-20 font-medium">{label}</label>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 accent-purple-500 disabled:cursor-not-allowed"
        disabled={disabled}
      />
    </div>
  );
};
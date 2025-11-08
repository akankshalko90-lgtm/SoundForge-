import React from 'react';
import type { Voice } from '../types';

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  onSelect: () => void;
}

const EmooticIcon: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" fillOpacity="0.3"/>
        <path d="M12,17.5C9.64,17.5 7.5,16.44 6,14.79C5.7,14.44 5.76,13.87 6.11,13.57C6.46,13.27 7.03,13.33 7.33,13.68C8.5,15.03 10.16,15.75 12,15.75C13.84,15.75 15.5,15.03 16.67,13.68C16.97,13.33 17.54,13.27 17.89,13.57C18.24,13.87 18.3,14.44 18,14.79C16.5,16.44 14.36,17.5 12,17.5Z" fill="currentColor"/>
        <circle cx="9" cy="10.5" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="10.5" r="1.5" fill="currentColor"/>
    </svg>
);


export const VoiceCard: React.FC<VoiceCardProps> = ({ voice, isSelected, onSelect }) => {
  return (
    <div
      className={`relative rounded-xl cursor-pointer transition-all duration-300 ${isSelected ? 'p-[2px] bg-gradient-to-r from-cyan-400 to-purple-600' : 'p-[2px] bg-gray-800'}`}
      onClick={onSelect}
    >
      <div className="bg-[#1A1C2C] rounded-[10px] p-4 h-full space-y-3">
        <div className="flex items-center space-x-4">
          <img src={voice.avatarUrl} alt={voice.name} className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <h3 className="font-semibold text-white">{voice.name}</h3>
            <p className="text-sm text-gray-400">{voice.language}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <EmooticIcon />
            <span className="text-xs font-medium text-gray-300">{voice.tag}</span>
        </div>
      </div>
    </div>
  );
};

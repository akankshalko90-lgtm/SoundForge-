import React, { useState } from 'react';
import type { Voice } from '../types';
import { VoiceCard } from './VoiceCard';

interface VoiceLibraryProps {
  voices: Voice[];
  selectedVoice: Voice | null;
  onSelectVoice: (voice: Voice) => void;
}

const SearchIcon: React.FC = () => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({ voices, selectedVoice, onSelectVoice }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');

  const languages = ['All Languages', ...Array.from(new Set(voices.map(v => v.language)))];

  const filteredVoices = voices.filter(voice => {
    const languageMatch = selectedLanguage === 'All Languages' || voice.language === selectedLanguage;
    const searchMatch = voice.name.toLowerCase().includes(searchTerm.toLowerCase());
    return languageMatch && searchMatch;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Voice Library</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full sm:w-1/3 bg-[#1A1C2C] border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Filter by language"
        >
          {languages.map(lang => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1C2C] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-2">
        {filteredVoices.length > 0 ? (
            filteredVoices.map(voice => (
              <VoiceCard
                key={voice.name}
                voice={voice}
                isSelected={selectedVoice?.name === voice.name}
                onSelect={() => onSelectVoice(voice)}
              />
            ))
        ) : (
            <p className="text-gray-500 sm:col-span-2 text-center py-8">No voices match your criteria.</p>
        )}
      </div>
    </div>
  );
};
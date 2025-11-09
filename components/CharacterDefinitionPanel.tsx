import React from 'react';
import type { DefinedCharacter } from '../types';

interface CharacterDefinitionPanelProps {
  characters: DefinedCharacter[];
  setCharacters: (characters: DefinedCharacter[]) => void;
  isDetecting: boolean;
}

const TrashIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
  </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const CharacterDefinitionPanel: React.FC<CharacterDefinitionPanelProps> = ({ characters, setCharacters, isDetecting }) => {
  
  const handleRemoveCharacter = (nameToRemove: string) => {
    setCharacters(characters.filter(c => c.name !== nameToRemove));
  };

  const handleSetGender = (nameToSet: string, gender: 'Male' | 'Female') => {
    setCharacters(
      characters.map(c =>
        c.name === nameToSet
          ? { ...c, gender: gender }
          : c
      )
    );
  };

  return (
    <div className="space-y-3 bg-[#1A1C2C] p-4 rounded-xl border border-gray-800">
      <div className="flex items-center space-x-2">
        <h3 className="text-md font-semibold text-gray-300">Detected Characters</h3>
        {isDetecting && <SpinnerIcon />}
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Characters are auto-detected from your script. Use the 'M'/'F' buttons to set gender.
      </p>
      {characters.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
          {characters.map(char => (
            <div key={char.name} className="flex items-center justify-between bg-[#0D0F1A] border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm">
                <span className="font-semibold text-gray-200 flex-1 truncate pr-2">{char.name}</span>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button 
                        onClick={() => handleSetGender(char.name, 'Male')} 
                        title="Set gender to Male"
                        className={`w-6 h-6 rounded text-xs transition-colors flex items-center justify-center ${char.gender === 'Male' ? 'bg-blue-500 text-white font-bold' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                    >
                        M
                    </button>
                    <button 
                        onClick={() => handleSetGender(char.name, 'Female')} 
                        title="Set gender to Female"
                        className={`w-6 h-6 rounded text-xs transition-colors flex items-center justify-center ${char.gender === 'Female' ? 'bg-pink-500 text-white font-bold' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                    >
                        F
                    </button>
                    <button onClick={() => handleRemoveCharacter(char.name)} aria-label={`Remove ${char.name}`} className="pl-1 text-gray-500 hover:text-red-400">
                        <TrashIcon />
                    </button>
                </div>
            </div>
          ))}
        </div>
      ) : (
         <p className="text-xs text-gray-500 text-center py-2">
            {isDetecting ? 'Detecting characters...' : 'No characters detected yet. Type a script with speaker names.'}
        </p>
      )}
    </div>
  );
};

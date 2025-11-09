import React, { useState, useEffect } from 'react';
import type { Voice } from '../types';

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  onSelect: () => void;
  onPlaySample: (voiceId: string) => void;
  isPlayingSample: boolean;
}

const PlayCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10.47 16.28L6.22 12.03L7.63 10.62L10.47 13.46L16.37 7.56L17.78 8.97L10.47 16.28Z" />
  </svg>
);

const MaleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V12M12 12L9 9M12 12L15 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="16" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FemaleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="10" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14V20M10 17H14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C10.34 6 9 7.34 9 9C9 10.66 10.34 12 12 12C13.66 12 15 10.66 15 9C15 7.34 13.66 6 12 6ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
    </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const VoiceCard: React.FC<VoiceCardProps> = ({ voice, isSelected, onSelect, onPlaySample, isPlayingSample }) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    setImageStatus('loading');
  }, [voice.avatarUrl]);

  const handlePlayClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isPlayingSample) {
          onPlaySample(voice.id);
      }
  };

  return (
    <div
      className={`relative group bg-[#1A1C2C] rounded-xl cursor-pointer transition-all duration-300 border-2
        ${isSelected 
          ? 'border-purple-500' 
          : 'border-gray-800 hover:border-gray-700'
        } hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20`}
      onClick={onSelect}
    >
      {isSelected && (
        <CheckCircleIcon className="absolute -top-2 -right-2 w-6 h-6 text-purple-500 bg-[#1A1C2C] rounded-full z-10" />
      )}
      <div className="flex flex-col items-center p-4 space-y-2">
        <div className="relative w-20 h-20">
          {imageStatus === 'loading' && (
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-gray-800 animate-pulse"></div>
          )}
          {imageStatus === 'error' && (
             <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700">
               <UserCircleIcon className="w-16 h-16 text-gray-600" />
             </div>
          )}
          <img 
            src={voice.avatarUrl} 
            alt={voice.name} 
            className={`w-20 h-20 rounded-full border-2 border-gray-700 group-hover:border-cyan-400 transition-all duration-300 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageStatus('loaded')}
            onError={() => setImageStatus('error')}
          />
          <div 
            className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full flex items-center justify-center transition-all duration-300 ${imageStatus !== 'loaded' ? 'hidden' : ''}`}
            onClick={handlePlayClick}
            aria-label={isPlayingSample ? `Loading sample for ${voice.name}` : `Play sample for ${voice.name}`}
            role="button"
            tabIndex={0}
          >
            {isPlayingSample ? (
              <SpinnerIcon className="w-8 h-8 text-white" />
            ) : (
              <PlayCircleIcon className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </div>
        </div>

        <div className="text-center">
          <h3 className="font-semibold text-white truncate">{voice.name}</h3>
          <p className="text-sm text-gray-400">{voice.language}</p>
        </div>
        
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 pt-1">
            {voice.gender === 'Male' && <MaleIcon className="w-4 h-4 text-blue-400" />}
            {voice.gender === 'Female' && <FemaleIcon className="w-4 h-4 text-pink-400" />}
            <span className="bg-gray-800/50 px-2 py-0.5 rounded-full">{voice.tag}</span>
        </div>
      </div>
    </div>
  );
};
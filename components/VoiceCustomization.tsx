import React from 'react';
import type { Voice, Emotion } from '../types';
import { Slider } from './Slider';

interface VoiceCustomizationProps {
  selectedVoice: Voice | null;
  generatedAudio: string | null;
  emotion: Emotion;
  onDownload: (audioData: string, fileName: string) => void;
}

export const VoiceCustomization: React.FC<VoiceCustomizationProps> = ({ selectedVoice, generatedAudio, emotion, onDownload }) => {

  const handleDownloadClick = () => {
    if (!generatedAudio || !selectedVoice) return;
    const fileName = `soundforge_${selectedVoice.name}_${emotion}.wav`;
    onDownload(generatedAudio, fileName);
  };
    
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Voice Customization</h2>
      <div className="bg-[#0D0F1A] p-6 rounded-xl border border-gray-800 space-y-4">
        {selectedVoice ? (
          <>
            {/* Note: These sliders are for display purposes as the current API does not support them directly. */}
            <Slider label="Pitch" value={50} onChange={() => {}} />
            <Slider label="Speed" value={50} onChange={() => {}} />
            <Slider label="Loudness" value={75} onChange={() => {}} />
            <div className="flex justify-between items-center pt-2">
              <span className="font-medium text-gray-300">Emotion</span>
              <span className="font-medium text-white bg-[#1A1C2C] px-3 py-1 rounded-md text-sm">{emotion}</span>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">Select a voice to see its details</p>
        )}
      </div>
      <button
        onClick={handleDownloadClick}
        disabled={!generatedAudio}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-purple-600/20"
      >
        Download
      </button>
    </div>
  );
};
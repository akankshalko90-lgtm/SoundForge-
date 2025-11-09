import React from 'react';
import type { Voice, Emotion, SpecialEffect, ExportFormat, SampleRate, BitDepth } from '../types';
import { Slider } from './Slider';
import { SPECIAL_EFFECTS } from '../constants';

interface VoiceCustomizationProps {
  selectedVoice: Voice | null;
  generatedAudio: string | null;
  emotion: Emotion;
  onDownload: (audioData: string, fileName:string, format: ExportFormat, bitrate: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  loudness: number;
  onLoudnessChange: (loudness: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  smartEmotionBlend: boolean;
  blendEmotion: Emotion;
  specialEffect: SpecialEffect;
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  exportBitrate: number;
  onExportBitrateChange: (bitrate: number) => void;
  onPreview: () => void;
  isPreviewing: boolean;
  isLocked: boolean;
  onLockedChange: (locked: boolean) => void;
  sampleRate: SampleRate;
  onSampleRateChange: (rate: SampleRate) => void;
  bitDepth: BitDepth;
  onBitDepthChange: (depth: BitDepth) => void;
}

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);

const LockOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2a3 3 0 00-3 3v2h6V7a3 3 0 00-3-3z" />
    </svg>
);

const VolumeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M7 4a1 1 0 00-2 0v12a1 1 0 102 0V4zM11 4a1 1 0 10-2 0v12a1 1 0 102 0V4zM4 8a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM14 8a1 1 0 100 2h1a1 1 0 100-2h-1z" />
  </svg>
);


export const VoiceCustomization: React.FC<VoiceCustomizationProps> = ({ 
  selectedVoice, 
  generatedAudio, 
  emotion, 
  onDownload, 
  speed, 
  onSpeedChange,
  loudness,
  onLoudnessChange,
  pitch,
  onPitchChange,
  volume,
  onVolumeChange,
  smartEmotionBlend,
  blendEmotion,
  specialEffect,
  exportFormat,
  onExportFormatChange,
  exportBitrate,
  onExportBitrateChange,
  onPreview,
  isPreviewing,
  isLocked,
  onLockedChange,
  sampleRate,
  onSampleRateChange,
  bitDepth,
  onBitDepthChange,
}) => {

  const handleDownloadClick = () => {
    if (!generatedAudio || !selectedVoice) return;
    const effectName = specialEffect !== 'None' ? `_${specialEffect}` : '';
    const baseFileName = `soundforge_${selectedVoice.name}_${emotion}${effectName}_speed${speed}_loudness${loudness}_pitch${pitch}`;
    const fileNameWithExtension = `${baseFileName}.${exportFormat}`;
    onDownload(generatedAudio, fileNameWithExtension, exportFormat, exportBitrate);
  };
  
  const displayEmotion = smartEmotionBlend && blendEmotion !== 'Neutral' && emotion !== 'Neutral'
    ? `${emotion} & ${blendEmotion}`
    : emotion;
    
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Voice Customization</h2>
      <div className="bg-[#1A1C2C] p-6 rounded-xl border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-300">Voice Parameters</h3>
              <button
                onClick={() => onLockedChange(!isLocked)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={isLocked ? "Unlock voice controls" : "Lock voice controls"}
                title={isLocked ? "Unlock controls" : "Lock controls"}
              >
                {isLocked ? <LockClosedIcon className="w-5 h-5" /> : <LockOpenIcon className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={onPreview}
              disabled={!selectedVoice || isPreviewing}
              className="flex items-center space-x-2 bg-purple-600/50 text-purple-200 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPreviewing ? (
                <SpinnerIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
              <span>{isPreviewing ? 'Generating...' : 'Preview'}</span>
            </button>
        </div>

        {selectedVoice ? (
          <>
            <div>
              <Slider label="Speed" value={speed} onChange={onSpeedChange} disabled={isLocked} />
              <div className="flex justify-between text-xs text-gray-500 mt-1 pl-24">
                <span>Slow</span>
                <span>Medium</span>
                <span>Fast</span>
              </div>
            </div>
            <Slider label="Loudness" value={loudness} onChange={onLoudnessChange} disabled={isLocked} />
            <Slider label="Pitch" value={pitch} onChange={onPitchChange} disabled={isLocked} />
            <div className="flex justify-between items-center pt-2">
              <span className="font-medium text-gray-300">Emotion</span>
              <span className="font-medium text-white bg-[#0D0F1A] px-3 py-1 rounded-md text-sm truncate">{displayEmotion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-300">Effect</span>
              <span className="font-medium text-white bg-[#0D0F1A] px-3 py-1 rounded-md text-sm truncate">
                {SPECIAL_EFFECTS.find(e => e.id === specialEffect)?.name || 'None'}
              </span>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">Select a voice to see its details</p>
        )}
      </div>
      
      <div className="bg-[#1A1C2C] p-6 rounded-xl border border-gray-800 space-y-4">
          <h3 className="text-lg font-semibold text-gray-300">Playback Controls</h3>
           <div className="flex items-center space-x-4 text-gray-300">
                <VolumeIcon className="w-5 h-5 text-gray-400" />
                <Slider label="Volume" value={volume} onChange={onVolumeChange} />
                <span className="w-10 text-right font-mono">{volume}%</span>
            </div>
      </div>


       <div className={`bg-[#1A1C2C] p-6 rounded-xl border border-gray-800 space-y-4 transition-opacity ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-300">Export Options</h3>
        <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="format-select" className="w-24 font-medium text-gray-300">Format</label>
              <select
                id="format-select"
                value={exportFormat}
                onChange={(e) => onExportFormatChange(e.target.value as ExportFormat)}
                className="flex-1 bg-[#0D0F1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed"
                disabled={isLocked}
              >
                <option value="wav">WAV (Lossless)</option>
                <option value="mp3">MP3 (Compressed)</option>
                <option value="ogg">OGG (Compressed)</option>
              </select>
            </div>
            { exportFormat === 'wav' && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-700">
                    <div className="flex items-center space-x-4">
                        <label htmlFor="samplerate-select" className="w-20 font-medium text-gray-300">Sample Rate</label>
                        <select
                            id="samplerate-select"
                            value={sampleRate}
                            onChange={(e) => onSampleRateChange(Number(e.target.value) as SampleRate)}
                            className="flex-1 bg-[#0D0F1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled
                            title="Source audio from the API is fixed at 24kHz"
                        >
                            <option value={24000}>24000 Hz (Source)</option>
                            <option value={44100}>44100 Hz</option>
                            <option value={48000}>48000 Hz</option>
                        </select>
                    </div>
                     <div className="flex items-center space-x-4">
                        <label htmlFor="bitdepth-select" className="w-20 font-medium text-gray-300">Bit Depth</label>
                        <select
                            id="bitdepth-select"
                            value={bitDepth}
                            onChange={(e) => onBitDepthChange(Number(e.target.value) as BitDepth)}
                            className="flex-1 bg-[#0D0F1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled
                            title="Source audio from the API is fixed at 16-bit"
                        >
                            <option value={16}>16-bit (Source)</option>
                            <option value={24}>24-bit</option>
                        </select>
                    </div>
                </div>
            )}
            { (exportFormat === 'mp3' || exportFormat === 'ogg') && (
              <div className="flex items-center space-x-4 text-gray-300">
                  <label className="w-24 font-medium">Bitrate</label>
                  <input
                      type="range"
                      min="64"
                      max="320"
                      step="32"
                      value={exportBitrate}
                      onChange={(e) => onExportBitrateChange(parseInt(e.target.value, 10))}
                      className="flex-1 disabled:cursor-not-allowed"
                      disabled={isLocked}
                  />
                  <span className="w-16 text-right font-mono">{exportBitrate} kbps</span>
              </div>
            )}
        </div>
      </div>

      <button
        onClick={handleDownloadClick}
        disabled={!generatedAudio}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-purple-600/20 transform hover:-translate-y-1"
      >
        Download
      </button>
    </div>
  );
};
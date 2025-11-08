import React, { useState, useEffect } from 'react';
import type { Voice, Emotion, NarrationStyle, Accent } from '../types';
import { ToggleSwitch } from './ToggleSwitch';
import { EMOTIONS, NARRATION_STYLES, ACCENTS_BY_LANGUAGE } from '../constants';

interface GeneratorPanelProps {
  selectedVoice: Voice | null;
  onGenerate: (text: string, isLongForm: boolean, autoDetectEmotion: boolean, autoDetectSpeakers: boolean) => void;
  isLoading: boolean;
  progress: number;
  emotion: Emotion;
  setEmotion: (emotion: Emotion) => void;
  narrationStyle: NarrationStyle;
  setNarrationStyle: (style: NarrationStyle) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

export const GeneratorPanel: React.FC<GeneratorPanelProps> = ({
  selectedVoice,
  onGenerate,
  isLoading,
  progress,
  emotion,
  setEmotion,
  narrationStyle,
  setNarrationStyle,
  accent,
  setAccent
}) => {
  const [text, setText] = useState('');
  const [isLongForm, setIsLongForm] = useState(false);
  const [autoDetectEmotion, setAutoDetectEmotion] = useState(false);
  const [autoDetectSpeakers, setAutoDetectSpeakers] = useState(false);
  const [availableAccents, setAvailableAccents] = useState<Accent[]>(['Default']);

  useEffect(() => {
    if (selectedVoice) {
      const baseLanguage = selectedVoice.language.split(' ')[0];
      const accentsForLang = ACCENTS_BY_LANGUAGE[baseLanguage] || ['Default'];
      setAvailableAccents(accentsForLang);
      
      if (!accentsForLang.includes(accent)) {
        setAccent('Default');
      }
    } else {
      setAvailableAccents(['Default']);
      setAccent('Default');
    }
  }, [selectedVoice, accent, setAccent]);


  const handleEmotionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoDetectEmotion(false); // Disable auto-detect on manual change
    setEmotion(e.target.value as Emotion);
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onGenerate(text, isLongForm, autoDetectEmotion, autoDetectSpeakers);
  };
  
  return (
    <div className="space-y-6">
       <div className="bg-[#1A1C2C] p-6 rounded-xl border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
                {isLongForm && <ToggleSwitch label="Intelligent Script Parsing" enabled={autoDetectSpeakers} setEnabled={setAutoDetectSpeakers} />}
                <ToggleSwitch label="Long Script Mode" enabled={isLongForm} setEnabled={setIsLongForm} />
            </div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Enter text... For intelligent parsing, use "Speaker: Dialogue" or quotes, e.g., "Hello," she said.'
                className="w-full h-32 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none resize-none"
            />
            {isLongForm && progress > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            )}
       </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="emotion-select" className="block text-sm font-medium text-gray-300">Emotion</label>
                    <ToggleSwitch label="Auto-detect" enabled={autoDetectEmotion} setEnabled={setAutoDetectEmotion} />
                </div>
                <select
                    id="emotion-select"
                    value={emotion}
                    onChange={handleEmotionChange}
                    className="w-full bg-[#1A1C2C] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            </div>
            
            <div className="space-y-2">
                <label htmlFor="accent-select" className="block text-sm font-medium text-gray-300">Accent</label>
                <select
                    id="accent-select"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value as Accent)}
                    className="w-full bg-[#1A1C2C] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {availableAccents.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                </select>
            </div>

            <div className="space-y-2">
                <label htmlFor="style-select" className="block text-sm font-medium text-gray-300">Narration Style</label>
                <select
                    id="style-select"
                    value={narrationStyle}
                    onChange={(e) => setNarrationStyle(e.target.value as NarrationStyle)}
                    className="w-full bg-[#1A1C2C] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {NARRATION_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                </select>
            </div>
        </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !text.trim() || !selectedVoice}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-600/30 flex items-center justify-center"
      >
        {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
        ) : 'Generate'}
      </button>
    </div>
  );
};
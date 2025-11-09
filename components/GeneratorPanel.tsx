import React, { useState, useEffect, useRef } from 'react';
import type { Voice, Emotion, NarrationStyle, Accent, DefinedCharacter, SpecialEffect } from '../types';
import { ToggleSwitch } from './ToggleSwitch';
import { EMOTIONS, NARRATION_STYLES, ACCENTS_BY_LANGUAGE, SPECIAL_EFFECTS } from '../constants';
import { CharacterDefinitionPanel } from './CharacterDefinitionPanel';
import { extractSpeakersFromScript } from '../services/geminiService';

interface GeneratorPanelProps {
  selectedVoice: Voice | null;
  onGenerate: (text: string, isLongForm: boolean, autoDetectEmotion: boolean, autoDetectSpeakers: boolean, autoDetectEffect: boolean, autoDetectNarrationStyle: boolean) => void;
  isLoading: boolean;
  progress: number;
  emotion: Emotion;
  setEmotion: (emotion: Emotion) => void;
  narrationStyle: NarrationStyle;
  setNarrationStyle: (style: NarrationStyle) => void;
  autoDetectNarrationStyle: boolean;
  setAutoDetectNarrationStyle: (auto: boolean) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  definedCharacters: DefinedCharacter[];
  setDefinedCharacters: (characters: DefinedCharacter[]) => void;
  smartEmotionBlend: boolean;
  setSmartEmotionBlend: (blend: boolean) => void;
  blendEmotion: Emotion;
  setBlendEmotion: (emotion: Emotion) => void;
  specialEffect: SpecialEffect;
  setSpecialEffect: (effect: SpecialEffect) => void;
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
  autoDetectNarrationStyle,
  setAutoDetectNarrationStyle,
  accent,
  setAccent,
  definedCharacters,
  setDefinedCharacters,
  smartEmotionBlend,
  setSmartEmotionBlend,
  blendEmotion,
  setBlendEmotion,
  specialEffect,
  setSpecialEffect,
}) => {
  const [text, setText] = useState('');
  const [isLongForm, setIsLongForm] = useState(false);
  const [autoDetectEmotion, setAutoDetectEmotion] = useState(false);
  const [autoDetectSpeakers, setAutoDetectSpeakers] = useState(false);
  const [autoDetectEffect, setAutoDetectEffect] = useState(false);
  const [availableAccents, setAvailableAccents] = useState<Accent[]>(['Default']);
  const [isDetectingCharacters, setIsDetectingCharacters] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedVoice) {
      const isEnglish = selectedVoice.languageCode.startsWith('en-');
      if (isEnglish) {
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
    } else {
      setAvailableAccents(['Default']);
      setAccent('Default');
    }
  }, [selectedVoice, setAccent]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (isLongForm && autoDetectSpeakers && text.trim().length > 50) {
      debounceTimeoutRef.current = window.setTimeout(async () => {
        setIsDetectingCharacters(true);
        try {
          const detectedCharacters = await extractSpeakersFromScript(text);
          const existingNames = new Set(definedCharacters.map(c => c.name.toLowerCase()));
          
          const newCharacters: DefinedCharacter[] = detectedCharacters
            .filter(char => !existingNames.has(char.name.toLowerCase()));

          if (newCharacters.length > 0) {
            setDefinedCharacters([...definedCharacters, ...newCharacters]);
          }
        } catch (error) {
          console.error("Failed to auto-detect characters:", error);
        } finally {
          setIsDetectingCharacters(false);
        }
      }, 1500); // 1.5 second debounce
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [text, isLongForm, autoDetectSpeakers, definedCharacters, setDefinedCharacters]);


  const handleEmotionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoDetectEmotion(false); // Disable auto-detect on manual change
    setEmotion(e.target.value as Emotion);
  };

  const handleEffectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoDetectEffect(false); // Disable auto-detect on manual change
    setSpecialEffect(e.target.value as SpecialEffect);
  };

  const handleNarrationStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoDetectNarrationStyle(false);
    setNarrationStyle(e.target.value as NarrationStyle);
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onGenerate(text, isLongForm, autoDetectEmotion, autoDetectSpeakers, autoDetectEffect, autoDetectNarrationStyle);
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
       
       {isLongForm && autoDetectSpeakers && (
          <CharacterDefinitionPanel
            characters={definedCharacters}
            setCharacters={setDefinedCharacters}
            isDetecting={isDetectingCharacters}
          />
        )}

        <div className="space-y-4">
            <div className="bg-[#1A1C2C] p-4 rounded-xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-md font-semibold text-gray-300">Emotion Engine</h4>
                    <ToggleSwitch label="Auto-detect Emotion" enabled={autoDetectEmotion} setEnabled={setAutoDetectEmotion} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label htmlFor="emotion-select" className="text-xs font-medium text-gray-400">Base Emotion</label>
                        <select
                            id="emotion-select"
                            value={emotion}
                            onChange={handleEmotionChange}
                            disabled={autoDetectEmotion}
                            className="w-full bg-[#0D0F1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between h-5">
                            <label htmlFor="blend-emotion-select" className="text-xs font-medium text-gray-400">Blend With</label>
                            <ToggleSwitch label="Smart Blend" enabled={smartEmotionBlend} setEnabled={setSmartEmotionBlend} />
                        </div>
                        <select
                            id="blend-emotion-select"
                            value={blendEmotion}
                            onChange={(e) => setBlendEmotion(e.target.value as Emotion)}
                            disabled={!smartEmotionBlend || autoDetectEmotion}
                            className="w-full bg-[#0D0F1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             <option value="Neutral">None</option>
                             {EMOTIONS.filter(e => e !== 'Neutral' && e !== emotion).map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-[#1A1C2C] p-4 rounded-xl border border-gray-800 space-y-4">
                <h4 className="text-md font-semibold text-gray-300">Styles &amp; Effects</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between h-5">
                            <label htmlFor="effect-select" className="text-xs font-medium text-gray-400">Special Effect</label>
                            <ToggleSwitch label="Auto" enabled={autoDetectEffect} setEnabled={setAutoDetectEffect} />
                        </div>
                        <select
                            id="effect-select"
                            value={specialEffect}
                            onChange={handleEffectChange}
                            disabled={autoDetectEffect}
                            className="w-full bg-[#0D0F1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {SPECIAL_EFFECTS.map(effect => <option key={effect.id} value={effect.id}>{effect.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="accent-select" className="text-xs font-medium text-gray-400 h-5 block">Accent</label>
                        <select
                            id="accent-select"
                            value={accent}
                            onChange={(e) => setAccent(e.target.value as Accent)}
                            className="w-full bg-[#0D0F1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedVoice?.languageCode.startsWith('en-')}
                            title={!selectedVoice?.languageCode.startsWith('en-') ? 'Accents are only available for English voices' : ''}
                        >
                            {availableAccents.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between h-5">
                            <label htmlFor="style-select" className="text-xs font-medium text-gray-400">Narration Style</label>
                            <ToggleSwitch label="Auto" enabled={autoDetectNarrationStyle} setEnabled={setAutoDetectNarrationStyle} />
                        </div>
                        <select
                            id="style-select"
                            value={narrationStyle}
                            onChange={handleNarrationStyleChange}
                            disabled={autoDetectNarrationStyle}
                            className="w-full bg-[#0D0F1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {NARRATION_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>


      <button
        onClick={handleSubmit}
        disabled={isLoading || !text.trim() || !selectedVoice}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-600/30 flex items-center justify-center transform hover:-translate-y-1"
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

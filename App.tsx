import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { VoiceLibrary } from './components/VoiceLibrary';
import { GeneratorPanel } from './components/GeneratorPanel';
import { VoiceCustomization } from './components/VoiceCustomization';
import { JobHistory } from './components/JobHistory';
import { VOICES } from './constants';
import type { Voice, Emotion, NarrationStyle, Job, Accent, Chunk, DefinedCharacter, SpecialEffect, ExportFormat, SampleRate, BitDepth } from './types';
import { generateSpeech, parseIntelligentScript, detectEmotions, detectEmotion, detectEffect, detectNarrationStyle } from './services/geminiService';
import { decode, decodeAudioData, concatenateUint8Arrays, encode, createWavBlob, createMp3Blob, createOggBlob } from './utils/audioUtils';
import { detectGenderFromName } from './utils/textUtils';

const App: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(VOICES[0]);
  const [emotion, setEmotion] = useState<Emotion>('Neutral');
  const [narrationStyle, setNarrationStyle] = useState<NarrationStyle>('Default');
  const [autoDetectNarrationStyle, setAutoDetectNarrationStyle] = useState<boolean>(false);
  const [accent, setAccent] = useState<Accent>('Default');
  const [speed, setSpeed] = useState<number>(50);
  const [loudness, setLoudness] = useState<number>(75);
  const [pitch, setPitch] = useState<number>(50);
  const [volume, setVolume] = useState<number>(80);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isCustomizationLocked, setIsCustomizationLocked] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
        const savedJobs = window.localStorage.getItem('soundforge-jobs');
         // Simple validation to avoid corrupted data
        if (savedJobs) {
            const parsed = JSON.parse(savedJobs);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
        return [];
    } catch (error) {
        console.error("Could not load jobs from local storage", error);
        return [];
    }
  });
  const [definedCharacters, setDefinedCharacters] = useState<DefinedCharacter[]>([]);
  const [playingSampleVoiceId, setPlayingSampleVoiceId] = useState<string | null>(null);
  const [smartEmotionBlend, setSmartEmotionBlend] = useState<boolean>(false);
  const [blendEmotion, setBlendEmotion] = useState<Emotion>('Neutral');
  const [specialEffect, setSpecialEffect] = useState<SpecialEffect>('None');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');
  const [exportBitrate, setExportBitrate] = useState<number>(192);
  const [sampleRate, setSampleRate] = useState<SampleRate>(24000);
  const [bitDepth, setBitDepth] = useState<BitDepth>(16);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);


  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioDataCache = useRef<Map<string, string>>(new Map());


  useEffect(() => {
    // FIX: Cast window to `any` to allow `webkitAudioContext` for older browser compatibility.
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume / 100;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    try {
        // FIX: Strip audio data before saving to localStorage to prevent exceeding quota.
        const jobsToSave = jobs.map(job => ({
            ...job,
            audioData: null, // Don't save the large combined audio string
            chunks: job.chunks.map(chunk => ({
                ...chunk,
                audioData: null, // Don't save individual chunk audio strings
            })),
        }));
        window.localStorage.setItem('soundforge-jobs', JSON.stringify(jobsToSave));
    } catch (error) {
        console.error("Could not save jobs to local storage", error);
    }
  }, [jobs]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = newVolume / 100;
    }
  };

  const stopCurrentPlayback = () => {
    if (audioSourceRef.current) {
      // Prevent the 'onended' callback from firing when we manually stop the audio.
      audioSourceRef.current.onended = null;
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if stop is called on an already stopped source.
      }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    setPlayingAudioId(null);
  };

  const playAudio = async (base64Audio: string, audioId: string) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    
    // Stop any currently playing audio before starting a new one.
    stopCurrentPlayback();

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    try {
      const pcmData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);
      
      source.onended = () => {
        // This event fires when the audio finishes playing naturally.
        // We only clear state if this specific source was the one that ended
        // to prevent race conditions.
        if (audioSourceRef.current === source) {
          audioSourceRef.current = null;
          setPlayingAudioId(null);
        }
      };
      
      source.start();
      audioSourceRef.current = source;
      setPlayingAudioId(audioId);
    } catch (error) {
      console.error("Error playing audio:", error);
      alert("Failed to play audio. See console for details.");
      setPlayingAudioId(null); // Ensure state is clean after an error
    }
  };

  const handleDownload = (base64Audio: string, fileName: string, format: ExportFormat, bitrate: number, sampleRate: SampleRate, bitDepth: BitDepth) => {
    if (!base64Audio) return;
    const pcmData = decode(base64Audio);
    
    let blob: Blob;
    switch (format) {
      case 'mp3':
        blob = createMp3Blob(pcmData, 24000, 1, bitrate);
        break;
      case 'ogg':
        blob = createOggBlob(pcmData, 24000, 1, bitrate);
        break;
      case 'wav':
      default:
        // The API provides 24kHz, 16-bit audio. The parameters are passed for header correctness.
        blob = createWavBlob(pcmData, sampleRate, 1, bitDepth);
        break;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handlePlayFromHistory = (audioId: string) => {
    const audioData = audioDataCache.current.get(audioId);
    if (audioData) {
        playAudio(audioData, audioId);
    } else {
        console.warn(`Audio data not found in cache for ID: ${audioId}`);
        alert("Could not find audio data to play. It may have been cleared after a page reload.");
    }
  };

  const handleDownloadFromHistory = (audioId: string, fileName: string, format: ExportFormat) => {
      const audioData = audioDataCache.current.get(audioId);
      if (audioData) {
          handleDownload(audioData, fileName, format, exportBitrate, sampleRate, bitDepth);
      } else {
          console.warn(`Audio data not found in cache for ID: ${audioId}`);
          alert("Could not find audio data to download. It may have been cleared after a page reload.");
      }
  };


  const previewTexts: { [key: string]: string } = {
      'English': "Hello, this is a sample of my voice.",
      'Hindi': "नमस्ते, यह मेरी आवाज़ का एक नमूना है।",
      'Tamil': "வணக்கம், இது என் குரலின் ஒரு மாதிரி.",
      'Bengali': "নমস্কার, এটি আমার কণ্ঠের একটি নমুনা।",
      'Telugu': "నమస్కారం, ఇది నా స్వరానికి ఒక నమూనా.",
      'Marathi': "नमस्कार, हा माझ्या आवाजाचा नमुना आहे.",
      'Gujarati': "નમસ્તે, આ મારા અવાજનો નમૂનો છે.",
      'Kannada': "ನಮಸ್ಕಾರ, ಇದು ನನ್ನ ಧ್ವನಿಯ ಮಾದರಿ.",
      'Malayalam': "നമസ്കാരം, ഇത് എൻ്റെ ശബ്ദത്തിൻറെ ഒരു സാമ്പിൾ ആണ്.",
      'Punjabi': "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਇਹ ਮੇਰੀ ਆਵਾਜ਼ ਦਾ ਇੱਕ ਨਮੂনা ਹੈ।",
      'Odia': "ନମସ୍କାର, ଏହା ମୋ ସ୍ୱରର ଏକ ନମୁନା ଅଟେ।",
      'Assamese': "নমস্কাৰ, এইটো মোৰ মাতৰ এটা নমুনা।",
      'Urdu': "ہیلو، یہ میری آواز کا ایک نمونہ ہے۔",
  };

  const handlePlaySample = async (voiceId: string) => {
      setPlayingSampleVoiceId(voiceId);
      try {
          const voice = VOICES.find(v => v.id === voiceId);
          if (!voice) throw new Error("Voice not found");
          
          const baseLanguage = voice.language.split(' ')[0];
          const sampleText = previewTexts[baseLanguage] || "Hello, you can listen to my voice now.";

          const audioBase64 = await generateSpeech(sampleText, voice.apiId, 'Neutral', 'Default', voice.languageCode, 'Default', 50, false, 'Neutral', 75, 50, 'None');
          await playAudio(audioBase64, voiceId);
      } catch (error) {
          console.error("Error playing voice sample:", error);
          alert("Could not play voice sample. See console for details.");
      } finally {
          setPlayingSampleVoiceId(null);
      }
  };

  const handlePreview = async () => {
    if (!selectedVoice) {
      alert("Please select a voice to preview.");
      return;
    }
    
    setIsPreviewing(true);

    try {
        const baseLanguage = selectedVoice.language.split(' ')[0];
        const previewText = previewTexts[baseLanguage] || "This is a preview of the current voice settings.";

        const audioBase64 = await generateSpeech(
            previewText,
            selectedVoice.apiId,
            emotion,
            narrationStyle,
            selectedVoice.languageCode,
            accent,
            speed,
            smartEmotionBlend,
            blendEmotion,
            loudness,
            pitch,
            specialEffect
        );
        await playAudio(audioBase64, `preview-${selectedVoice.id}`);
    } catch (error) {
        console.error("Error generating preview:", error);
        alert("Could not generate preview. See console for details.");
    } finally {
        setIsPreviewing(false);
    }
  };

  const handleGenerate = async (text: string, isLongForm: boolean, autoDetectEmotion: boolean, autoDetectSpeakers: boolean, autoDetectEffect: boolean, autoDetectNarrationStyle: boolean) => {
    if (!selectedVoice) {
      alert("Please select a voice first.");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setGeneratedAudio(null);
    
    const jobId = `job-${Date.now()}`;

    if (isLongForm) {
       let chunksToProcess: {
          text: string;
          voiceId: string;
          speaker: string | null;
          emotion: Emotion;
          effect: SpecialEffect;
          narrationStyle: NarrationStyle;
       }[] = [];

      if (autoDetectSpeakers) {
         try {
            const intelligentChunks = await parseIntelligentScript(text, autoDetectEmotion, autoDetectEffect, definedCharacters, autoDetectNarrationStyle);

            const speakerVoiceMap = new Map<string, string>();
            const definedCharacterMap = new Map(definedCharacters.map(c => [c.name.toLowerCase(), c.gender]));

            const femaleVoices = VOICES.filter(v => v.gender === 'Female');
            const maleVoices = VOICES.filter(v => v.gender === 'Male');
            
            if (intelligentChunks.some(c => c.gender === 'Female') && femaleVoices.length === 0) {
                alert("Intelligent parsing detected a female speaker, but no female voices are available in the library.");
                setIsLoading(false);
                return;
            }
            if (intelligentChunks.some(c => c.gender === 'Male') && maleVoices.length === 0) {
                alert("Intelligent parsing detected a male speaker, but no male voices are available in the library.");
                setIsLoading(false);
                return;
            }

            let femaleIndex = 0;
            let maleIndex = 0;

            chunksToProcess = intelligentChunks
                .filter(chunk => chunk.text && chunk.text.trim().length > 0)
                .map(chunk => {
                    let voiceId = selectedVoice.id;
                    let speakerId: string | null = null;

                    if (chunk.type === 'narration') {
                        voiceId = selectedVoice.id;
                    } else { // It's dialogue
                        speakerId = chunk.speaker || `Speaker ${femaleIndex + maleIndex + 1}`;
                        if (speakerVoiceMap.has(speakerId)) {
                            voiceId = speakerVoiceMap.get(speakerId)!;
                        } else {
                            // Gender detection hierarchy:
                            // 1. User-defined character
                            // 2. AI-inferred gender
                            // 3. Name-based gender detection
                            let assignedGender: 'Male' | 'Female' | 'Neutral' = 'Neutral';
                            const definedGender = definedCharacterMap.get(speakerId.toLowerCase());
                            if (definedGender === 'Male' || definedGender === 'Female') {
                                assignedGender = definedGender;
                            } else if (chunk.gender && chunk.gender !== 'Neutral') {
                                assignedGender = chunk.gender;
                            } else if (chunk.speaker) {
                                assignedGender = detectGenderFromName(chunk.speaker);
                            }

                            if (assignedGender === 'Female' && femaleVoices.length > 0) {
                                voiceId = femaleVoices[femaleIndex % femaleVoices.length].id;
                                femaleIndex++;
                            } else if (assignedGender === 'Male' && maleVoices.length > 0) {
                                voiceId = maleVoices[maleIndex % maleVoices.length].id;
                                maleIndex++;
                            } else { // Fallback for Neutral or if no voices of detected gender exist
                                if ((femaleIndex + maleIndex) % 2 === 0 && femaleVoices.length > 0) {
                                  voiceId = femaleVoices[femaleIndex % femaleVoices.length].id;
                                  femaleIndex++;
                                } else if (maleVoices.length > 0) {
                                  voiceId = maleVoices[maleIndex % maleVoices.length].id;
                                  maleIndex++;
                                } else {
                                  voiceId = selectedVoice.id; // Absolute fallback
                                }
                            }
                            speakerVoiceMap.set(speakerId, voiceId);
                        }
                    }
                    return { 
                      text: chunk.text, 
                      voiceId, 
                      speaker: speakerId, 
                      emotion: (autoDetectEmotion && chunk.emotion) ? chunk.emotion : emotion,
                      effect: (autoDetectEffect && chunk.effect) ? chunk.effect : specialEffect,
                      narrationStyle: (autoDetectNarrationStyle && chunk.narrationStyle) ? chunk.narrationStyle : narrationStyle,
                    };
            });
        } catch (error) {
            console.error(error);
            alert((error as Error).message || "An error occurred during intelligent script parsing.");
            setIsLoading(false);
            return;
        }

      } else {
        const sentences = text.match(/[^.!?]+[.!?\n]*/g) || [text];
        const chunkTexts = sentences.filter(s => s.trim().length > 0);
        
        const chunkEmotions = autoDetectEmotion 
          ? await detectEmotions(chunkTexts) 
          : new Array(chunkTexts.length).fill(emotion);
        
        const finalNarrationStyle = autoDetectNarrationStyle 
          ? (await detectNarrationStyle(text)) ?? narrationStyle 
          : narrationStyle;
          
        chunksToProcess = chunkTexts.map((s, index) => ({ 
          text: s.trim(), 
          voiceId: selectedVoice.id, 
          speaker: null,
          emotion: chunkEmotions[index] ?? emotion,
          effect: specialEffect,
          narrationStyle: finalNarrationStyle,
        }));
      }
      
      if (chunksToProcess.length === 0) {
        setIsLoading(false);
        return;
      }
      
      const initialChunks: Chunk[] = chunksToProcess.map((chunk, index) => ({
        id: `${jobId}-chunk-${index}`,
        text: chunk.text,
        status: 'pending',
        audioData: null,
        voiceId: chunk.voiceId,
        speaker: chunk.speaker ?? undefined,
        emotion: chunk.emotion,
        effect: chunk.effect,
        narrationStyle: chunk.narrationStyle,
      }));

      const newJob: Job = {
        id: jobId,
        status: 'processing',
        textSnippet: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        chunks: initialChunks,
        audioData: null,
      };
      setJobs(prev => [newJob, ...prev]);

      let completedChunksCount = 0;
      const audioChunks: (Uint8Array | null)[] = [];
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 500;

      for (const chunk of newJob.chunks) {
        // Find the voice for this chunk BEFORE the retry loop for validation.
        const voiceForChunk = chunk.voiceId ? VOICES.find(v => v.id === chunk.voiceId) : selectedVoice;

        // Explicitly check if a specific voice ID was required but not found.
        if (chunk.voiceId && !voiceForChunk) {
            console.error(`Could not find voice with ID "${chunk.voiceId}" for chunk. Marking as failed to prevent using wrong voice.`);
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, chunks: j.chunks.map(c => c.id === chunk.id ? { ...c, status: 'failed' } : c) } : j));
            audioChunks.push(null);
            completedChunksCount++;
            setProgress((completedChunksCount / newJob.chunks.length) * 100);
            continue; // Move to the next chunk
        }

        // This check is for safety, should not be hit if selectedVoice logic is sound.
        if (!voiceForChunk) {
            console.error(`No voice available for chunk. Skipping.`);
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, chunks: j.chunks.map(c => c.id === chunk.id ? { ...c, status: 'failed' } : c) } : j));
            audioChunks.push(null);
            completedChunksCount++;
            setProgress((completedChunksCount / newJob.chunks.length) * 100);
            continue;
        }

        let success = false;
        
        // Set chunk to processing for visual feedback
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, chunks: j.chunks.map(c => c.id === chunk.id ? { ...c, status: 'processing' } : c) } : j));

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const chunkEmotion = chunk.emotion!;
                const chunkEffect = chunk.effect!;
                const chunkNarrationStyle = chunk.narrationStyle!;
                
                const audioBase64 = await generateSpeech(chunk.text, voiceForChunk.apiId, chunkEmotion, chunkNarrationStyle, voiceForChunk.languageCode, accent, speed, smartEmotionBlend, blendEmotion, loudness, pitch, chunkEffect);
                
                audioDataCache.current.set(chunk.id, audioBase64);

                setJobs(prev => prev.map(j => j.id === jobId ? { ...j, chunks: j.chunks.map(c => c.id === chunk.id ? { ...c, status: 'completed', audioData: null, emotion: chunkEmotion, effect: chunkEffect, narrationStyle: chunkNarrationStyle } : c) } : j));
                audioChunks.push(decode(audioBase64));
                success = true;
                break; // Exit retry loop on success
            } catch (error) {
                console.error(`Attempt ${attempt + 1} of ${MAX_RETRIES} failed for chunk "${chunk.text.slice(0, 20)}...":`, error);
                if (attempt < MAX_RETRIES - 1) {
                    await delay(RETRY_DELAY * (attempt + 1)); // Simple increasing backoff
                }
            }
        }

        if (!success) {
            // All retries failed, mark as failed
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, chunks: j.chunks.map(c => c.id === chunk.id ? { ...c, status: 'failed' } : c) } : j));
            audioChunks.push(null);
        }

        completedChunksCount++;
        setProgress((completedChunksCount / newJob.chunks.length) * 100);
        if (completedChunksCount < newJob.chunks.length) {
            await delay(200); // Delay between processing different chunks
        }
      }
      
      const successfulChunks = audioChunks.filter((c): c is Uint8Array => c !== null);
      
      if (successfulChunks.length > 0) {
        const combinedPcm = concatenateUint8Arrays(successfulChunks);
        const finalAudioData = encode(combinedPcm);
        audioDataCache.current.set(jobId, finalAudioData);
        setGeneratedAudio(finalAudioData);
        await playAudio(finalAudioData, jobId);
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed', audioData: null } : j));
      } else {
        alert('Audio generation failed for all chunks. This might be due to API rate limits or network issues. Please check your script and try again.');
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'failed' } : j));
      }
    } else {
      const newJob: Job = {
        id: jobId, status: 'pending', textSnippet: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        chunks: [{ id: `${jobId}-chunk-0`, text: text.trim(), status: 'pending', audioData: null, voiceId: selectedVoice.id }], audioData: null,
      };
      setJobs(prev => [newJob, ...prev]);
      try {
        const finalEmotion = autoDetectEmotion ? (await detectEmotion(text)) ?? emotion : emotion;
        const finalEffect = autoDetectEffect ? (await detectEffect(text)) ?? specialEffect : specialEffect;
        const finalNarrationStyle = autoDetectNarrationStyle ? (await detectNarrationStyle(text)) ?? narrationStyle : narrationStyle;
        const finalAudioData = await generateSpeech(text, selectedVoice.apiId, finalEmotion, finalNarrationStyle, selectedVoice.languageCode, accent, speed, smartEmotionBlend, blendEmotion, loudness, pitch, finalEffect);
        
        audioDataCache.current.set(jobId, finalAudioData);
        audioDataCache.current.set(`${jobId}-chunk-0`, finalAudioData);

        setGeneratedAudio(finalAudioData);
        await playAudio(finalAudioData, jobId);
        setJobs(prev => prev.map(j => j.id === jobId ? {
          ...j, status: 'completed', audioData: null,
          chunks: j.chunks.map(c => ({...c, status: 'completed', audioData: null, emotion: finalEmotion, effect: finalEffect, narrationStyle: finalNarrationStyle }))
        } : j));
      } catch (error) {
         console.error("Error generating short-form speech:", error);
         alert("Audio generation failed. This might be due to API rate limits or network issues. Please check the console for more details.");
         setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'failed', chunks: j.chunks.map(c => ({ ...c, status: 'failed' })) } : j));
      }
    }

    setIsLoading(false);
    setProgress(0);
  };

  return (
    <div className="bg-[#0D0F1A] min-h-screen text-white font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header />
        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <VoiceLibrary 
              voices={VOICES} 
              selectedVoice={selectedVoice} 
              onSelectVoice={(voice) => {
                stopCurrentPlayback();
                setGeneratedAudio(null);
                setSelectedVoice(voice);
              }}
              onPlaySample={handlePlaySample}
              playingSampleVoiceId={playingSampleVoiceId}
            />
            <GeneratorPanel 
              selectedVoice={selectedVoice}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              progress={progress}
              emotion={emotion}
              setEmotion={setEmotion}
              narrationStyle={narrationStyle}
              setNarrationStyle={setNarrationStyle}
              autoDetectNarrationStyle={autoDetectNarrationStyle}
              setAutoDetectNarrationStyle={setAutoDetectNarrationStyle}
              accent={accent}
              setAccent={setAccent}
              definedCharacters={definedCharacters}
              setDefinedCharacters={setDefinedCharacters}
              smartEmotionBlend={smartEmotionBlend}
              setSmartEmotionBlend={setSmartEmotionBlend}
              blendEmotion={blendEmotion}
              setBlendEmotion={setBlendEmotion}
              specialEffect={specialEffect}
              setSpecialEffect={setSpecialEffect}
            />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <VoiceCustomization 
              selectedVoice={selectedVoice}
              generatedAudio={generatedAudio}
              emotion={emotion}
              onDownload={(audioData, fileName, format, bitrate) => handleDownload(audioData, fileName, format, bitrate, sampleRate, bitDepth)}
              speed={speed}
              onSpeedChange={setSpeed}
              loudness={loudness}
              onLoudnessChange={setLoudness}
              pitch={pitch}
              onPitchChange={setPitch}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              smartEmotionBlend={smartEmotionBlend}
              blendEmotion={blendEmotion}
              specialEffect={specialEffect}
              exportFormat={exportFormat}
              onExportFormatChange={setExportFormat}
              exportBitrate={exportBitrate}
              onExportBitrateChange={setExportBitrate}
              onPreview={handlePreview}
              isPreviewing={isPreviewing}
              isLocked={isCustomizationLocked}
              onLockedChange={setIsCustomizationLocked}
              sampleRate={sampleRate}
              onSampleRateChange={setSampleRate}
              bitDepth={bitDepth}
              onBitDepthChange={setBitDepth}
            />
            <JobHistory 
              jobs={jobs}
              voices={VOICES}
              onPlay={handlePlayFromHistory}
              onDownload={handleDownloadFromHistory}
              playingAudioId={playingAudioId}
              onStop={stopCurrentPlayback}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
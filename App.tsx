import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { VoiceLibrary } from './components/VoiceLibrary';
import { GeneratorPanel } from './components/GeneratorPanel';
import { VoiceCustomization } from './components/VoiceCustomization';
import { JobHistory } from './components/JobHistory';
import { VOICES } from './constants';
import type { Voice, Emotion, NarrationStyle, Job, Accent, Chunk } from './types';
import { generateSpeech, detectEmotion, parseIntelligentScript, detectEmotions } from './services/geminiService';
import { decode, decodeAudioData, concatenateUint8Arrays, encode, createWavBlob } from './utils/audioUtils';

const App: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(VOICES[0]);
  const [emotion, setEmotion] = useState<Emotion>('Neutral');
  const [narrationStyle, setNarrationStyle] = useState<NarrationStyle>('Default');
  const [accent, setAccent] = useState<Accent>('Default');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // FIX: Cast window to `any` to allow `webkitAudioContext` for older browser compatibility.
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const stopCurrentPlayback = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if stop is called on an already stopped source.
      }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
  };

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    stopCurrentPlayback();

    try {
      const pcmData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      audioSourceRef.current = source;
    } catch (error) {
      console.error("Error playing audio:", error);
      alert("Failed to play audio. See console for details.");
    }
  };

  const handleDownload = (base64Audio: string, fileName: string) => {
    if (!base64Audio) return;
    const pcmData = decode(base64Audio);
    const blob = createWavBlob(pcmData, 24000, 1);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async (text: string, isLongForm: boolean, autoDetectEmotion: boolean, autoDetectSpeakers: boolean) => {
    if (!selectedVoice) {
      alert("Please select a voice first.");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setGeneratedAudio(null);
    stopCurrentPlayback();
    
    const jobId = `job-${Date.now()}`;

    if (isLongForm) {
       let chunksToProcess: {
          text: string;
          voiceId: string;
          speaker: string | null;
          emotion: Emotion;
       }[] = [];

      if (autoDetectSpeakers) {
         try {
            const intelligentChunks = await parseIntelligentScript(text, autoDetectEmotion);

            const speakerVoiceMap = new Map<string, string>();
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
                            const assignedGender = chunk.gender || 'Neutral';
                            if (assignedGender === 'Female' && femaleVoices.length > 0) {
                                voiceId = femaleVoices[femaleIndex % femaleVoices.length].id;
                                femaleIndex++;
                            } else if (assignedGender === 'Male' && maleVoices.length > 0) {
                                voiceId = maleVoices[maleIndex % maleVoices.length].id;
                                maleIndex++;
                            } else {
                                if ((femaleIndex + maleIndex) % 2 === 0 && femaleVoices.length > 0) {
                                  voiceId = femaleVoices[femaleIndex % femaleVoices.length].id;
                                  femaleIndex++;
                                } else if (maleVoices.length > 0) {
                                  voiceId = maleVoices[maleIndex % maleVoices.length].id;
                                  maleIndex++;
                                } else {
                                  voiceId = selectedVoice.id;
                                }
                            }
                            speakerVoiceMap.set(speakerId, voiceId);
                        }
                    }
                    return { text: chunk.text, voiceId, speaker: speakerId, emotion: (autoDetectEmotion && chunk.emotion) ? chunk.emotion : emotion };
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
          
        chunksToProcess = chunkTexts.map((s, index) => ({ 
          text: s.trim(), 
          voiceId: selectedVoice.id, 
          speaker: null,
          emotion: chunkEmotions[index] ?? emotion
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

      const chunkPromises = newJob.chunks.map(async (chunk) => {
        try {
          const chunkEmotion = chunk.emotion!;
          const voiceForChunk = chunk.voiceId ? VOICES.find(v => v.id === chunk.voiceId) || selectedVoice : selectedVoice;
          
          const audioBase64 = await generateSpeech(chunk.text, voiceForChunk.id, chunkEmotion, narrationStyle, voiceForChunk.language, accent);
          
          completedChunksCount++;
          setProgress((completedChunksCount / newJob.chunks.length) * 100);
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, chunks: j.chunks.map(c => c.id === chunk.id ? { ...c, status: 'completed', audioData: audioBase64, emotion: chunkEmotion } : c) } : j));
          return decode(audioBase64);
        } catch (error) {
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, chunks: j.chunks.map(c => c.id === chunk.id ? { ...c, status: 'failed' } : c) } : j));
          return null;
        }
      });
      
      const audioChunks = await Promise.all(chunkPromises);
      const successfulChunks = audioChunks.filter((c): c is Uint8Array => c !== null);
      
      if (successfulChunks.length > 0) {
        const combinedPcm = concatenateUint8Arrays(successfulChunks);
        const finalAudioData = encode(combinedPcm);
        setGeneratedAudio(finalAudioData);
        await playAudio(finalAudioData);
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed', audioData: finalAudioData } : j));
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
        const finalAudioData = await generateSpeech(text, selectedVoice.id, finalEmotion, narrationStyle, selectedVoice.language, accent);
        setGeneratedAudio(finalAudioData);
        await playAudio(finalAudioData);
        setJobs(prev => prev.map(j => j.id === jobId ? {
          ...j, status: 'completed', audioData: finalAudioData,
          chunks: j.chunks.map(c => ({...c, status: 'completed', audioData: finalAudioData, emotion: finalEmotion }))
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
              accent={accent}
              setAccent={setAccent}
            />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <VoiceCustomization 
              selectedVoice={selectedVoice}
              generatedAudio={generatedAudio}
              emotion={emotion}
              onDownload={handleDownload}
            />
            <JobHistory 
              jobs={jobs}
              voices={VOICES}
              onPlay={playAudio}
              onDownload={handleDownload}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
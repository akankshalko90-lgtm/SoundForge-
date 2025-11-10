import React, { useState, useRef, useEffect } from 'react';
import type { Job, Chunk, Voice, ExportFormat } from '../types';

const StatusIndicator: React.FC<{ status: Job['status'] | Chunk['status'] }> = ({ status }) => {
  const baseClasses = "w-2.5 h-2.5 rounded-full flex-shrink-0";
  const statusClasses = {
    completed: "bg-green-400",
    processing: "bg-yellow-400 animate-pulse",
    pending: "bg-gray-500",
    failed: "bg-red-500",
  };
  return <div className={`${baseClasses} ${statusClasses[status]}`} />;
};

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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

const DownloadButton: React.FC<{ onDownloadRequest: (format: ExportFormat) => void; iconSizeClass?: string }> = ({ onDownloadRequest, iconSizeClass = "w-5 h-5" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDownload = (format: ExportFormat) => {
        onDownloadRequest(format);
        setIsOpen(false);
    }
    
    const stopPropagationAndToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={stopPropagationAndToggle} className="text-gray-400 hover:text-cyan-400 transition-all duration-200 transform hover:scale-110" aria-label="Download audio options">
                <DownloadIcon className={iconSizeClass} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-28 bg-[#2A2C3C] border border-gray-700 rounded-md shadow-lg z-20">
                    <ul className="py-1 text-sm text-gray-200">
                        <li>
                            <button onClick={() => handleDownload('wav')} className="block w-full text-left px-4 py-2 hover:bg-purple-600/50">WAV</button>
                        </li>
                        <li>
                            <button onClick={() => handleDownload('mp3')} className="block w-full text-left px-4 py-2 hover:bg-purple-600/50">MP3</button>
                        </li>
                        <li>
                            <button onClick={() => handleDownload('ogg')} className="block w-full text-left px-4 py-2 hover:bg-purple-600/50">OGG</button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

interface JobHistoryProps {
  jobs: Job[];
  voices: Voice[];
  onPlay: (audioId: string) => void;
  onDownload: (audioId: string, fileName: string, format: ExportFormat) => void;
  playingAudioId: string | null;
  onStop: () => void;
}

const JobHistoryItem: React.FC<{ 
    job: Job; 
    voices: Voice[]; 
    onPlay: JobHistoryProps['onPlay']; 
    onDownload: JobHistoryProps['onDownload'];
    playingAudioId: string | null;
    onStop: () => void;
}> = ({ job, voices, onPlay, onDownload, playingAudioId, onStop }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isJobPlaying = job.id === playingAudioId;

  const handleDownloadCombined = (format: ExportFormat) => {
    onDownload(job.id, `soundforge_combined_${job.id}.${format}`, format);
  }

  const handlePlayCombined = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isJobPlaying) {
        onStop();
    } else {
        onPlay(job.id);
    }
  }

  return (
    <div className="bg-[#1A1C2C] rounded-lg transition-all duration-300">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <StatusIndicator status={job.status} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{job.textSnippet}</p>
            <p className="text-xs text-gray-500">
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)} - {job.chunks.length} chunk{job.chunks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {job.status === 'completed' && (
            <>
              <DownloadButton onDownloadRequest={handleDownloadCombined} />
              <button onClick={handlePlayCombined} className="text-gray-400 hover:text-cyan-400 transition-all duration-200 transform hover:scale-110" aria-label={isJobPlaying ? "Stop combined audio" : "Play combined audio"}>
                {isJobPlaying ? <StopIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
              </button>
            </>
          )}
          <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-gray-700/50 mx-3 my-1 py-2 space-y-1">
          {job.chunks.map((chunk, index) => {
            const voiceForChunk = chunk.voiceId ? voices.find(v => v.id === chunk.voiceId) : null;
            const isChunkPlaying = chunk.id === playingAudioId;

            const handlePlayChunk = () => {
                if (isChunkPlaying) {
                    onStop();
                } else {
                    onPlay(chunk.id);
                }
            };
            
            const handleDownloadChunk = (format: ExportFormat) => {
              onDownload(chunk.id, `chunk_${job.id}_${index + 1}.${format}`, format);
            };

            return (
              <div key={chunk.id} className="flex items-center justify-between pl-2 pr-1 py-1">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <StatusIndicator status={chunk.status} />
                  <p className="text-xs text-gray-400 truncate flex-1">
                    <span className="font-semibold text-gray-500 mr-2">{index + 1}.</span>
                    {chunk.speaker && <span className="font-semibold text-purple-300 mr-1">{chunk.speaker}:</span>}
                    {chunk.text}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {voiceForChunk && (
                    <div className="flex items-center space-x-1 text-xs font-medium text-cyan-300 bg-[#1F3A4E] px-2 py-0.5 rounded-full border border-cyan-800/70">
                      <span>{voiceForChunk.name}</span>
                      {voiceForChunk.gender === 'Male' && <MaleIcon className="w-3 h-3 text-blue-400" />}
                      {voiceForChunk.gender === 'Female' && <FemaleIcon className="w-3 h-3 text-pink-400" />}
                    </div>
                  )}
                  {chunk.narrationStyle && chunk.narrationStyle !== 'Default' && (
                    <span className="text-xs font-medium text-yellow-300 bg-[#4A4A2A] px-2 py-0.5 rounded-full border border-yellow-800/70">
                      {chunk.narrationStyle}
                    </span>
                  )}
                  {chunk.emotion && (
                    <span className="text-xs font-medium text-purple-300 bg-[#2C2A4A] px-2 py-0.5 rounded-full border border-purple-800/70">
                      {chunk.emotion}
                    </span>
                  )}
                  {chunk.effect && chunk.effect !== 'None' && (
                    <span className="text-xs font-medium text-teal-300 bg-[#1A3F3F] px-2 py-0.5 rounded-full border border-teal-800/70">
                      {chunk.effect}
                    </span>
                  )}
                  {chunk.status === 'completed' && (
                     <div className="flex items-center space-x-1">
                        <DownloadButton onDownloadRequest={handleDownloadChunk} iconSizeClass="w-4 h-4" />
                        <button onClick={handlePlayChunk} className="text-gray-400 hover:text-cyan-400 transition-all duration-200 transform hover:scale-110" aria-label={isChunkPlaying ? `Stop chunk ${index + 1}`: `Play chunk ${index + 1}`}>
                          {isChunkPlaying ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        </button>
                     </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export const JobHistory: React.FC<JobHistoryProps> = ({ jobs, voices, onPlay, onDownload, playingAudioId, onStop }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Job History</h2>
      <div className="bg-[#0D0F1A] p-4 rounded-xl border border-gray-800 space-y-3 max-h-72 overflow-y-auto">
        {jobs.length > 0 ? (
          jobs.map(job => <JobHistoryItem key={job.id} job={job} voices={voices} onPlay={onPlay} onDownload={onDownload} playingAudioId={playingAudioId} onStop={onStop} />)
        ) : (
          <p className="text-gray-500 text-center py-8">Your generated audio jobs will appear here.</p>
        )}
      </div>
    </div>
  );
};
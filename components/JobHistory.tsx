import React, { useState } from 'react';
import type { Job, Chunk, Voice } from '../types';

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

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
);

interface JobHistoryProps {
  jobs: Job[];
  voices: Voice[];
  onPlay: (audioData: string) => void;
  onDownload: (audioData: string, fileName: string) => void;
}

const JobHistoryItem: React.FC<{ job: Job; voices: Voice[]; onPlay: JobHistoryProps['onPlay']; onDownload: JobHistoryProps['onDownload'] }> = ({ job, voices, onPlay, onDownload }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDownloadCombined = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.audioData) onDownload(job.audioData, `soundforge_combined_${job.id}.wav`);
  }

  const handlePlayCombined = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.audioData) onPlay(job.audioData);
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
          {job.status === 'completed' && job.audioData && (
            <>
              <button onClick={handleDownloadCombined} className="text-gray-400 hover:text-cyan-400 transition-colors" aria-label="Download combined audio">
                <DownloadIcon className="w-5 h-5" />
              </button>
              <button onClick={handlePlayCombined} className="text-gray-400 hover:text-cyan-400 transition-colors" aria-label="Play combined audio">
                <PlayIcon className="w-6 h-6" />
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
                    <span className="text-xs font-medium text-cyan-300 bg-[#1F3A4E] px-2 py-0.5 rounded-full border border-cyan-800/70">
                      {voiceForChunk.name}
                    </span>
                  )}
                  {chunk.emotion && (
                    <span className="text-xs font-medium text-purple-300 bg-[#2C2A4A] px-2 py-0.5 rounded-full border border-purple-800/70">
                      {chunk.emotion}
                    </span>
                  )}
                  {chunk.status === 'completed' && chunk.audioData && (
                     <div className="flex items-center space-x-1">
                        <button onClick={() => onDownload(chunk.audioData!, `chunk_${index + 1}.wav`)} className="text-gray-400 hover:text-cyan-400 transition-colors" aria-label={`Download chunk ${index + 1}`}>
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => onPlay(chunk.audioData!)} className="text-gray-400 hover:text-cyan-400 transition-colors" aria-label={`Play chunk ${index + 1}`}>
                          <PlayIcon className="w-5 h-5" />
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

export const JobHistory: React.FC<JobHistoryProps> = ({ jobs, voices, onPlay, onDownload }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Job History</h2>
      <div className="bg-[#0D0F1A] p-4 rounded-xl border border-gray-800 space-y-3 max-h-72 overflow-y-auto">
        {jobs.length > 0 ? (
          jobs.map(job => <JobHistoryItem key={job.id} job={job} voices={voices} onPlay={onPlay} onDownload={onDownload} />)
        ) : (
          <p className="text-gray-500 text-center py-8">Your generated audio jobs will appear here.</p>
        )}
      </div>
    </div>
  );
};

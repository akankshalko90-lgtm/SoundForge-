
import React from 'react';

const SoundWaveIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="23" stroke="url(#paint0_linear_1_2)" strokeWidth="2"/>
    <path d="M12 24H15C15.5523 24 16 23.5523 16 23V25C16 25.5523 15.5523 26 15 26H12C11.4477 26 11 25.5523 11 25V23C11 22.4477 11.4477 22 12 22V24Z" fill="#7B2FF7"/>
    <path d="M18 20V28C18 28.5523 17.5523 29 17 29H16V19H17C17.5523 19 18 19.4477 18 20Z" fill="#7B2FF7"/>
    <path d="M22 16V32H21V16H22Z" fill="#00FFFF"/>
    <path d="M26 20V28H27V20H26Z" fill="#00FFFF"/>
    <path d="M31 24H30V26H31V24Z" fill="#7B2FF7"/>
    <path d="M34 24H33V26H34V24Z" fill="#7B2FF7"/>
    <path d="M36 22V26H37V22H36Z" fill="#7B2FF7"/>
    <defs>
      <linearGradient id="paint0_linear_1_2" x1="0" y1="24" x2="48" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00FFFF"/>
        <stop offset="1" stopColor="#7B2FF7"/>
      </linearGradient>
    </defs>
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="flex items-center space-x-4">
      <SoundWaveIcon />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
          SOUNDFORGE
        </h1>
        <p className="text-sm text-gray-400">Voice Beyond Words</p>
      </div>
    </header>
  );
};

import type { Voice, Emotion, NarrationStyle, Accent } from './types';

// FIX: Capitalize voice IDs to match the expected format for the Gemini API's `voiceName` parameter.
export const VOICES: Voice[] = [
  {
    id: 'Kore',
    name: 'Kore',
    language: 'English (US)',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-kore.png',
    tag: 'Narrator',
    gender: 'Female',
  },
  {
    id: 'Puck',
    name: 'Puck',
    language: 'English (US)',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-puck.png',
    tag: 'Announcer',
    gender: 'Male',
  },
  {
    id: 'Charon',
    name: 'Charon',
    language: 'English (UK)',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-charon.png',
    tag: 'Storyteller',
    gender: 'Male',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    language: 'English (UK)',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-zephyr.png',
    tag: 'Assistant',
    gender: 'Female',
  },
  {
    id: 'Kore', // Changed from 'anjali' to a valid voice ID
    name: 'Anjali',
    language: 'Hindi',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-anjali.png',
    tag: 'Conversational',
    gender: 'Female',
  },
  {
    id: 'Puck',
    name: 'Rohan',
    language: 'Hindi',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-krishna.png',
    tag: 'Friendly',
    gender: 'Male',
  },
  {
    id: 'Puck', // Changed from 'krishna' to a valid voice ID
    name: 'Krishna',
    language: 'Tamil',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-krishna.png',
    tag: 'Formal',
    gender: 'Male',
  },
  {
    id: 'Kore',
    name: 'Kavya',
    language: 'Tamil',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-anjali.png',
    tag: 'Expressive',
    gender: 'Female',
  },
   {
    id: 'Kore', // Changed from 'riya' to a valid voice ID
    name: 'Riya',
    language: 'Bengali',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-riya.png',
    tag: 'Friendly',
    gender: 'Female',
  },
  {
    id: 'Puck',
    name: 'Aarav',
    language: 'Bengali',
    avatarUrl: 'https://storage.googleapis.com/aai-web-samples/avatar-krishna.png',
    tag: 'Calm',
    gender: 'Male',
  },
];

export const EMOTIONS: Emotion[] = [
  'Neutral', 
  'Happy', 
  'Sad', 
  'Angry', 
  'Cheerful', 
  'Calm', 
  'Excited', 
  'Amused', 
  'Joyful', 
  'Hopeful', 
  'Terrified', 
  'Disgusted', 
  'Fearful', 
  'Whispering', 
  'Serious', 
  'Formal'
];

export const NARRATION_STYLES: NarrationStyle[] = ['Default', 'Storytelling', 'Poetry'];

export const ACCENTS_BY_LANGUAGE: { [key: string]: Accent[] } = {
  'English': ['Default', 'US English', 'UK English', 'Indian English', 'Australian English', 'Scottish English', 'Punjabi', 'Hyderabadi'],
  'Hindi': ['Default', 'Mumbai', 'Delhi', 'Punjabi', 'Hyderabadi'],
  'Tamil': ['Default', 'Chennai', 'Hyderabadi'],
  'Bengali': ['Default', 'Kolkata', 'Bengali (Indian)'],
};
// FIX: Define and export types to resolve module errors across the application.

export type Emotion =
  | 'Neutral'
  | 'Happy'
  | 'Sad'
  | 'Angry'
  | 'Cheerful'
  | 'Calm'
  | 'Excited'
  | 'Amused'
  | 'Joyful'
  | 'Hopeful'
  | 'Terrified'
  | 'Disgusted'
  | 'Fearful'
  | 'Whispering'
  | 'Serious'
  | 'Formal';

export type NarrationStyle = 'Default' | 'Storytelling' | 'Poetry';

export type Accent =
  | 'Default'
  | 'US English'
  | 'UK English'
  | 'Indian English'
  | 'Australian English'
  | 'Scottish English'
  | 'Mumbai'
  | 'Delhi'
  | 'Chennai'
  | 'Kolkata'
  | 'Punjabi'
  | 'Hyderabadi'
  | 'Bengali (Indian)';

export interface Voice {
  id: string;
  name: string;
  language: string;
  avatarUrl: string;
  tag: string;
  gender: 'Male' | 'Female' | 'Neutral';
}

export interface Chunk {
  id: string;
  text: string;
  status: 'completed' | 'pending' | 'failed';
  audioData: string | null;
  emotion?: Emotion;
  voiceId?: string;
  speaker?: string;
}

export interface Job {
  id: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  textSnippet: string;
  chunks: Chunk[];
  audioData: string | null;
}

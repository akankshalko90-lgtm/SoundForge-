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
  | 'Formal'
  // FIX: Add missing emotion types to align with the values in `constants.ts`.
  | 'Sarcastic'
  | 'Worried'
  | 'Curious'
  | 'Ashamed'
  | 'Confused'
  | 'Enthusiastic'
  | 'Disappointed'
  | 'Proud';

export type NarrationStyle = 'Default' | 'Storytelling' | 'Poetry';

export type Accent =
  | 'Default'
  | 'US English'
  | 'UK English'
  | 'Indian English'
  | 'Australian English'
  | 'Scottish English'
  | 'Irish English'
  | 'South African English'
  | 'Mumbai'
  | 'Delhi'
  | 'Chennai'
  | 'Kolkata'
  | 'Punjabi'
  // FIX: Correct typo from 'Hyderadi' to 'Hyderabadi'. This resolves errors in constants.ts.
  | 'Hyderabadi'
  | 'Bengali (Indian)'
  | 'Lucknowi'
  | 'UP'
  | 'Bihari'
  | 'Rajasthani'
  | 'Coimbatore'
  | 'Madurai'
  | 'Sri Lankan'
  | 'Dhaka'
  | 'Telangana'
  | 'Andhra'
  | 'Pune'
  | 'Nagpur'
  | 'Ahmedabad'
  | 'Surat'
  | 'Bengaluru'
  | 'Mangalore'
  | 'Kochi'
  | 'Kozhod'
  | 'Bhojpuri'
  | 'Amritsari'
  | 'Ludhianvi'
  | 'Bhubaneswari'
  | 'Cuttacki'
  | 'Guwahati'
  | 'Jorhat'
  | 'Karachi'
  | 'Lahori'
  | 'Haryanvi'
  | 'Tirunelveli'
  | 'Sylheti'
  | 'Rayalaseema'
  | 'Konkani'
  | 'Kathiawadi'
  | 'Mysuru'
  | 'Trivandrum'
  | 'Majha'
  | 'Sambalpuri'
  | 'Upper Assam'
  | 'Deccani';

export type SpecialEffect = 'None' | 'Devil' | 'Robot' | 'Ghost' | 'Dual';

export type ExportFormat = 'wav' | 'mp3' | 'ogg';

export type SampleRate = 24000 | 44100 | 48000;

export type BitDepth = 16 | 24;

export interface Voice {
  id: string; // A unique identifier for use within the application, e.g., "kore-en-us"
  apiId: string; // The identifier required by the Gemini API, e.g., "Kore"
  name: string;
  language: string;
  languageCode: string;
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
  effect?: SpecialEffect;
  narrationStyle?: NarrationStyle;
}

export interface Job {
  id: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  textSnippet: string;
  chunks: Chunk[];
  audioData: string | null;
}

export interface DefinedCharacter {
  name: string;
  gender: 'Male' | 'Female';
}

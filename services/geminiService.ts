import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Emotion, NarrationStyle, Accent } from '../types';
import { EMOTIONS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface IntelligentChunk {
  type: 'dialogue' | 'narration';
  text: string;
  speaker?: string;
  gender?: 'Male' | 'Female' | 'Neutral';
  emotion?: Emotion;
}

export async function generateSpeech(text: string, voiceId: string, emotion: Emotion, narrationStyle: NarrationStyle, language: string, accent: Accent): Promise<string> {
    let instruction = '';
    if (emotion !== 'Neutral') {
      instruction = `Say with ${emotion.toLowerCase()} emotion:`;
    }

    if (narrationStyle === 'Storytelling') {
      instruction = `${instruction} As a storyteller, narrate the following.`.trim();
    } else if (narrationStyle === 'Poetry') {
      instruction = `${instruction} Recite the following poem.`.trim();
    }
    
    if (accent !== 'Default') {
        instruction = `${instruction} Speak with a ${accent} accent.`.trim();
    }
    
    const prompt = instruction ? `${instruction} "${text}"` : text;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceId },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech. Please check the console for more details.");
    }
}

export async function detectEmotion(text: string): Promise<Emotion | null> {
    if (!text.trim()) {
        return null;
    }

    const emotionList = EMOTIONS.join(', ');
    const prompt = `Analyze the emotion of the following text and return it in JSON format. The emotion must be one of the following: ${emotionList}.\n\nText: "${text}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        emotion: {
                            type: Type.STRING,
                            enum: EMOTIONS,
                        },
                    },
                    required: ["emotion"],
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        
        if (result.emotion && EMOTIONS.includes(result.emotion as Emotion)) {
            return result.emotion as Emotion;
        }
        return null;

    } catch (error) {
        console.error("Error detecting emotion:", error);
        return null;
    }
}

export async function detectEmotions(texts: string[]): Promise<(Emotion | null)[]> {
    if (!texts || texts.length === 0) {
        return [];
    }

    const emotionList = EMOTIONS.join(', ');
    const prompt = `For each text provided, analyze its emotion. The emotion must be one of: ${emotionList}. Respond with a JSON array where each object has an "emotion" key. The array should have the same number of items as the input texts. Texts to analyze: ${JSON.stringify(texts)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            emotion: {
                                type: Type.STRING,
                                enum: EMOTIONS,
                            },
                        },
                        required: ["emotion"],
                    }
                },
            },
        });

        const jsonString = response.text.trim();
        const results: { emotion: Emotion }[] = JSON.parse(jsonString);
        
        if (Array.isArray(results) && results.length === texts.length) {
            return results.map(r => (r.emotion && EMOTIONS.includes(r.emotion)) ? r.emotion : null);
        }
        console.warn("Emotion detection returned an array of unexpected length.");
        return new Array(texts.length).fill(null);

    } catch (error) {
        console.error("Error detecting emotions in batch:", error);
        return new Array(texts.length).fill(null);
    }
}

export async function parseIntelligentScript(script: string, detectEmotion: boolean): Promise<IntelligentChunk[]> {
  const emotionList = EMOTIONS.join(', ');
  
  const emotionInstructions = detectEmotion ? `
5. "emotion": The primary emotion of the text. The emotion must be one of the following: ${emotionList}.
` : '';

  const prompt = `Analyze the following script and parse it into a structured JSON array. Each element in the array should represent a single continuous piece of either dialogue or narration.
For each element, provide:
1. "type": "dialogue" or "narration".
2. "text": The content of the dialogue or narration. The dialogue text should not include the surrounding quotes.
3. "speaker" (for dialogue only): The speaker's name or a unique identifier (e.g., "Speaker 1"). Infer this from context like "John:" or attributions like "he said".
4. "gender" (for dialogue only): The inferred gender of the speaker ("Male", "Female", or "Neutral").
${emotionInstructions}
Example Input:
The sun was setting. "What a beautiful view," she said. Mark: I agree.

Example Output:
[
  {"type": "narration", "text": "The sun was setting."${detectEmotion ? ', "emotion": "Calm"' : ''}},
  {"type": "dialogue", "text": "What a beautiful view", "speaker": "Speaker 1", "gender": "Female"${detectEmotion ? ', "emotion": "Happy"' : ''}},
  {"type": "narration", "text": "she said."${detectEmotion ? ', "emotion": "Neutral"' : ''}},
  {"type": "dialogue", "text": "I agree.", "speaker": "Mark", "gender": "Male"${detectEmotion ? ', "emotion": "Neutral"' : ''}}
]

Script:
"""
${script}
"""
`;

  const properties: any = {
    type: { type: Type.STRING, enum: ['dialogue', 'narration'] },
    text: { type: Type.STRING },
    speaker: { type: Type.STRING },
    gender: { type: Type.STRING, enum: ['Male', 'Female', 'Neutral'] }
  };

  if (detectEmotion) {
    properties.emotion = { type: Type.STRING, enum: EMOTIONS };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: properties,
            required: ["type", "text"],
          }
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result as IntelligentChunk[];

  } catch (error) {
    console.error("Error parsing script intelligently:", error);
    throw new Error("Failed to parse script. Please check the console for details.");
  }
}
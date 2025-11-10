import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Emotion, NarrationStyle, Accent, DefinedCharacter, SpecialEffect } from '../types';
import { EMOTIONS, NARRATION_STYLES, SPECIAL_EFFECTS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface IntelligentChunk {
  type: 'dialogue' | 'narration';
  text: string;
  speaker?: string;
  gender?: 'Male' | 'Female' | 'Neutral';
  emotion?: Emotion;
  effect?: SpecialEffect;
  narrationStyle?: NarrationStyle;
}

export async function generateSpeech(
    text: string, 
    voiceId: string, 
    emotion: Emotion, 
    narrationStyle: NarrationStyle, 
    languageCode: string, 
    accent: Accent, 
    speed: number,
    smartEmotionBlend?: boolean,
    blendEmotion?: Emotion,
    loudness?: number,
    pitch?: number,
    specialEffect?: SpecialEffect,
): Promise<string> {
    let instruction = '';

    if (emotion !== 'Neutral') {
      if (smartEmotionBlend && blendEmotion && blendEmotion !== 'Neutral') {
          instruction = `Say with a blend of ${emotion.toLowerCase()} and ${blendEmotion.toLowerCase()} emotion:`;
      } else {
          instruction = `Say with ${emotion.toLowerCase()} emotion:`;
      }
    }

    if (narrationStyle === 'Storytelling') {
      instruction = `${instruction} As a storyteller, narrate the following.`.trim();
    } else if (narrationStyle === 'Poetry') {
      instruction = `${instruction} Recite the following poem.`.trim();
    }
    
    if (accent !== 'Default' && languageCode.startsWith('en-')) {
        instruction = `${instruction} Speak with a ${accent} accent.`.trim();
    }

    if (speed < 40) {
        instruction = `${instruction} Speak at a slow pace.`.trim();
    } else if (speed > 60) {
        instruction = `${instruction} Speak at a fast pace.`.trim();
    }

    if (loudness !== undefined) {
        if (loudness < 40) {
            instruction = `${instruction} Speak quietly.`.trim();
        } else if (loudness > 75) {
            instruction = `${instruction} Speak loudly.`.trim();
        }
    }

    if (pitch !== undefined) {
        if (pitch < 40) {
            instruction = `${instruction} Speak with a low pitch.`.trim();
        } else if (pitch > 60) {
            instruction = `${instruction} Speak with a high pitch.`.trim();
        }
    }

    let effectInstruction = '';
    switch (specialEffect) {
        case 'Devil':
            effectInstruction = 'Speak in a deep, menacing, demonic voice.';
            break;
        case 'Robot':
            effectInstruction = 'Speak in a flat, monotone, robotic voice.';
            break;
        case 'Ghost':
            effectInstruction = 'Speak in a wispy, ethereal, ghostly voice with a slight reverb.';
            break;
        case 'Dual':
            effectInstruction = 'Speak in a layered, choral voice with a slight echo, as if two voices are speaking in unison.';
            break;
    }

    if (effectInstruction) {
        instruction = `${effectInstruction} ${instruction}`.trim();
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
            const candidate = response.candidates?.[0];
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                if (candidate.finishReason === 'SAFETY') {
                    throw new Error("Audio generation failed due to safety filters. Please revise the text.");
                }
                throw new Error(`Audio generation stopped unexpectedly. Reason: ${candidate.finishReason}.`);
            }
            throw new Error("No audio data received from API. The prompt might be invalid or the voice model is unavailable for the provided text.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An unknown error occurred while generating speech. Please check the console.");
    }
}

export async function detectEmotion(text: string): Promise<Emotion | null> {
    if (!text.trim()) {
        return null;
    }

    const emotionList = EMOTIONS.join(', ');
    const prompt = `
        Analyze the emotion of the following text and return it in JSON format. The emotion must be one of the following: ${emotionList}.

        Consider the context and tone. For example:
        - "Wow, I can't believe I won the lottery!" should be 'Excited' or 'Joyful'.
        - "I'm so sorry for your loss." should be 'Sad'.
        - "Get out of my way!" should be 'Angry'.
        - "I wonder what's behind that door." should be 'Curious'.

        Text: "${text}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        emotion: {
                            type: Type.STRING,
                            enum: EMOTIONS
                        }
                    },
                    required: ['emotion']
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result && result.emotion && EMOTIONS.includes(result.emotion)) {
            return result.emotion;
        }
        return null;
    } catch (error) {
        console.error("Error detecting single emotion:", error);
        return null;
    }
}

export async function detectEmotions(texts: string[]): Promise<(Emotion | null)[]> {
    if (texts.length === 0) {
        return [];
    }

    const emotionList = EMOTIONS.join(', ');
    const textList = texts.map((t, i) => `${i + 1}. "${t}"`).join('\n');
    const prompt = `
        Analyze the emotion for each of the following text snippets. Return the result as a JSON array where each item corresponds to a snippet and contains its emotion. The emotion must be one of: ${emotionList}.
        
        Consider the context and tone. For example:
        - "Wow, I can't believe I won the lottery!" should be 'Excited' or 'Joyful'.
        - "I'm so sorry for your loss." should be 'Sad'.
        - "Get out of my way!" should be 'Angry'.

        ${textList}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            emotion: {
                                type: Type.STRING,
                                enum: EMOTIONS
                            }
                        },
                        required: ['emotion']
                    }
                }
            }
        });
        const jsonStr = response.text.trim();
        const results = JSON.parse(jsonStr);

        if (Array.isArray(results) && results.length === texts.length) {
            return results.map(r => (r && r.emotion && EMOTIONS.includes(r.emotion)) ? r.emotion : null);
        }
        // Fallback or error case
        return new Array(texts.length).fill(null);
    } catch (error) {
        console.error("Error detecting multiple emotions:", error);
        return new Array(texts.length).fill(null);
    }
}

export async function detectNarrationStyle(text: string): Promise<NarrationStyle | null> {
    if (!text.trim()) {
        return null;
    }

    const styleList = NARRATION_STYLES.join(', ');
    const prompt = `
        Analyze the narration style of the following text. The style must be one of: ${styleList}.
        - 'Poetry' for poems, verses, or lyrical content.
        - 'Storytelling' for narratives, fables, or descriptive stories.
        - 'Default' for general text, news, or factual content.
        Return the result in JSON format.

        Text: "${text}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        style: {
                            type: Type.STRING,
                            enum: NARRATION_STYLES
                        }
                    },
                    required: ['style']
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result && result.style && NARRATION_STYLES.includes(result.style)) {
            return result.style;
        }
        return 'Default';
    } catch (error) {
        console.error("Error detecting narration style:", error);
        return 'Default';
    }
}

export async function detectEffect(text: string): Promise<SpecialEffect | null> {
    if (!text.trim()) {
        return null;
    }

    const effectList = SPECIAL_EFFECTS.map(e => e.id).filter(e => e !== 'None').join(', ');
    const prompt = `
        Analyze the following text for special voice effects. Return the effect name in JSON format. The effect must be one of: ${effectList}. If no effect is described or implied, you MUST return "None".

        Look for explicit descriptions or strong implications:
        - Text like "he spoke in a cold, metallic, monotone voice" implies a 'Robot' effect.
        - Text like "a chilling, ethereal whisper echoed" implies a 'Ghost' effect.
        - Text like "his voice boomed with a dark, hellish power" implies a 'Devil' effect.
        - Text like "their voices rang out in unison" implies a 'Dual' effect.

        Text: "${text}"
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        effect: {
                            type: Type.STRING,
                            enum: SPECIAL_EFFECTS.map(e => e.id)
                        }
                    },
                    required: ['effect']
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result && result.effect && SPECIAL_EFFECTS.some(e => e.id === result.effect)) {
            return result.effect;
        }
        return 'None';
    } catch (error) {
        console.error("Error detecting special effect:", error);
        return 'None';
    }
}

export async function extractSpeakersFromScript(script: string): Promise<DefinedCharacter[]> {
    if (script.trim().length < 20) {
        return [];
    }

    const prompt = `
        Analyze the following script and extract all unique speaker names.
        For each name, infer their gender ('Male' or 'Female') based on the name and context.
        Return the result as a JSON array of objects, where each object has a 'name' and 'gender' property.
        If a name's gender is ambiguous, make a best guess. Do not include narrators.
        
        Example:
        Script: "John said, 'Hello.' Then, Mary replied, 'Hi there!'"
        Output: [{"name": "John", "gender": "Male"}, {"name": "Mary", "gender": "Female"}]

        Script:
        ---
        ${script}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            gender: { type: Type.STRING, enum: ['Male', 'Female'] },
                        },
                        required: ['name', 'gender'],
                    },
                },
            },
        });
        const jsonStr = response.text.trim();
        const detectedCharacters = JSON.parse(jsonStr) as { name: string; gender: 'Male' | 'Female' }[];
        return detectedCharacters.filter(c => c.name && c.gender);
    } catch (error) {
        console.error('Error extracting speakers:', error);
        return [];
    }
}

export async function parseIntelligentScript(text: string, detectEmotion: boolean, detectEffect: boolean, definedCharacters: DefinedCharacter[], autoDetectNarrationStyle: boolean): Promise<IntelligentChunk[]> {
    if (!text.trim()) {
        return [];
    }

    const emotionList = EMOTIONS.join(', ');
    const effectList = SPECIAL_EFFECTS.map(e => e.id).filter(e => e !== 'None').join(', ');
    const styleList = NARRATION_STYLES.join(', ');
    
    let emotionInstruction = '';
    if (detectEmotion) {
        emotionInstruction = `For EVERY chunk, you MUST include an 'emotion' field. If the chunk is dialogue, infer the emotion from the text and context. If the chunk is narration, the emotion MUST be 'Neutral'. The emotion value must be one of: ${emotionList}. This is a strict requirement.`;
    }

    let effectInstruction = '';
    if (detectEffect) {
        effectInstruction = `For each chunk (dialogue or narration), you MUST detect if a special voice effect is described or implied (e.g., 'he said robotically', 'a ghostly whisper'). The effect MUST be one of: ${effectList}. If no effect is implied, the effect MUST be "None".`;
    }

    let narrationStyleInstruction = '';
    if (autoDetectNarrationStyle) {
        narrationStyleInstruction = `For EVERY chunk, you MUST include a 'narrationStyle' field. For dialogue, this must be 'Default'. For narration, infer the style from the text ('Poetry', 'Storytelling', or 'Default'). The value must be one of: ${styleList}.`;
    }

    let characterContext = '';
    if (definedCharacters.length > 0) {
        const charDefs = definedCharacters.map(c => `- ${c.name} (${c.gender})`).join('\n');
        characterContext = `Use the following character definitions to help determine gender:\n${charDefs}\nIf a speaker is not in this list, infer their gender.`;
    }

    const prompt = `
        Analyze the following script and break it down into an ordered JSON array of chunks. Each chunk must be either 'dialogue' or 'narration'.
        
        Rules:
        1. Dialogue is anything spoken by a character, often in quotes or prefixed with a name (e.g., "John: Hello").
        2. Narration is descriptive text that is not spoken by a character.
        3. For each dialogue chunk, identify the 'speaker' and their 'gender' ('Male', 'Female', or 'Neutral' if unknown). For narration, 'speaker' must be null and gender 'Neutral'.
        4. Text content for each chunk should be clean, without speaker prefixes like "John:".
        ${emotionInstruction}
        ${effectInstruction}
        ${narrationStyleInstruction}
        ${characterContext}

        Script:
        ---
        ${text}
        ---
    `;

    const schema: any = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['dialogue', 'narration'], description: "The type of the script chunk." },
                text: { type: Type.STRING, description: "The text content of the chunk." },
                speaker: { type: Type.STRING, description: "The speaker's name for dialogue, or null for narration." },
                gender: { type: Type.STRING, enum: ['Male', 'Female', 'Neutral'], description: "The speaker's gender." },
            },
            required: ['type', 'text', 'speaker', 'gender'],
        },
    };

    if (detectEmotion) {
        schema.items.properties.emotion = { 
            type: Type.STRING, 
            enum: EMOTIONS, 
            description: "The inferred emotion of the chunk. For narration, this must be 'Neutral'. This field is required." 
        };
        schema.items.required.push('emotion');
    }

    if (detectEffect) {
        schema.items.properties.effect = { 
            type: Type.STRING, 
            enum: SPECIAL_EFFECTS.map(e => e.id), 
            description: "The inferred special voice effect. Must be 'None' if not applicable." 
        };
        schema.items.required.push('effect');
    }

    if (autoDetectNarrationStyle) {
        schema.items.properties.narrationStyle = {
            type: Type.STRING,
            enum: NARRATION_STYLES,
            description: "The inferred narration style. Must be 'Default' for dialogue."
        };
        schema.items.required.push('narrationStyle');
    }


    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr) as IntelligentChunk[];
        return result.filter(chunk => chunk.text && chunk.text.trim().length > 0);
    } catch (error) {
        console.error("Error parsing intelligent script:", error);
        throw new Error("Failed to parse script with AI. The script might be too complex or contain formatting the AI cannot understand. Please simplify it and try again.");
    }
}
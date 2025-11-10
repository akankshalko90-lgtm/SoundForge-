// Decodes a base64 string into a Uint8Array.
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encodes a Uint8Array into a base64 string.
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}


// Decodes raw PCM audio data into an AudioBuffer for playback.
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to generate the parts of a WAV file (header and data)
function createWavFileParts(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: 16 | 24): (DataView | Uint8Array)[] {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.byteLength;
  const chunkSize = 36 + dataSize;
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, 1, true);  // AudioFormat for PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  return [view, pcmData];
}

// Creates a valid WAV file Blob from raw PCM data.
export function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: 16 | 24 = 16): Blob {
    const fileParts = createWavFileParts(pcmData, sampleRate, numChannels, bitsPerSample);
    return new Blob(fileParts, { type: 'audio/wav' });
}

export function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);

  if (totalLength === 0) {
    return new Uint8Array(0);
  }

  const result = new Uint8Array(totalLength);
  let length = 0;
  for (const array of arrays) {
    result.set(array, length);
    length += array.length;
  }

  return result;
}

// Placeholder to create an MP3 file.
// This creates a WAV-structured file but with an MP3 MIME type, which is more robust for downloads than nesting blobs.
export function createMp3Blob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitrate: number = 192): Blob {
  console.log(`Simulating MP3 export at ${bitrate}kbps. A WAV-structured file will be downloaded.`);
  // In a real app, you would use an MP3 encoder library here.
  const fileParts = createWavFileParts(pcmData, sampleRate, numChannels, 16); // MP3 doesn't have bit depth like WAV, 16-bit is a standard source.
  return new Blob(fileParts, { type: 'audio/mpeg' });
}

// Placeholder to create an OGG file.
export function createOggBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitrate: number = 160): Blob {
  console.log(`Simulating OGG export at ${bitrate}kbps. A WAV-structured file will be downloaded.`);
  // In a real app, you would use an OGG encoder library here.
  const fileParts = createWavFileParts(pcmData, sampleRate, numChannels, 16);
  return new Blob(fileParts, { type: 'audio/ogg' });
}
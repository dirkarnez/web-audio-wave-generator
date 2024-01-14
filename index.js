// Create an OfflineAudioContext
const sampleRate = 44100; // The sample rate of the audio (e.g., 44100 Hz)
const duration = 5; // The duration of the audio in seconds
const numberOfChannels = 2; // The number of audio channels (e.g., stereo)
const offlineContext = new OfflineAudioContext(numberOfChannels, duration * sampleRate, sampleRate);

// Generate audio data
const bufferSize = sampleRate * duration;
const audioBuffer = offlineContext.createBuffer(numberOfChannels, bufferSize, sampleRate);

for (let channel = 0; channel < numberOfChannels; channel++) {
  const channelData = audioBuffer.getChannelData(channel);
  for (let i = 0; i < bufferSize; i++) {
    // Generate audio samples here
    // Example: Sine wave at 440 Hz
    const frequency = 440; // The frequency of the sine wave
    const amplitude = 0.5; // The amplitude of the sine wave
    const t = i / sampleRate;
    const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
    channelData[i] = sample;
  }
}

// Create an AudioBufferSourceNode and connect it to the destination
const source = offlineContext.createBufferSource();
source.buffer = audioBuffer;
source.connect(offlineContext.destination);

// Start rendering the audio
source.start();

// Wait for the rendering to complete
offlineContext.startRendering().then(renderedBuffer => {
  // Convert AudioBuffer to a WAV Blob
  const wavBuffer = exportToWav(renderedBuffer);

  // Save the WAV file
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audio.wav';
  link.click();
});

// Function to convert AudioBuffer to WAV buffer
function exportToWav(audioBuffer) {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numberOfChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  // WAV file header
  writeString(view, 0, 'RIFF'); // RIFF chunk identifier
  view.setUint32(4, length - 8, true); // RIFF chunk length
  writeString(view, 8, 'WAVE'); // RIFF type
  writeString(view, 12, 'fmt '); // fmt sub-chunk identifier
  view.setUint32(16, 16, true); // fmt sub-chunk length
  view.setUint16(20, 1, true); // Audio format (1 for PCM)
  view.setUint16(22, numberOfChannels, true); // Number of channels
  view.setUint32(24, audioBuffer.sampleRate, true); // Sample rate
  view.setUint32(28, audioBuffer.sampleRate * 4, true); // Byte rate (sample rate * block align)
  view.setUint16(32, numberOfChannels * 2, true); // Block align (channels * bytes per sample)
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, 'data'); // data sub-chunk identifier
  view.setUint32(40, length - 44, true); // data sub-chunk length

  // Write audio data
  const offset = 44;
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    let byteOffset = offset + channel * 2;
    for (let i = 0; i < audioBuffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(byteOffset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      byteOffset += numberOfChannels * 2;
    }
  }

  return buffer;
}

// Helper function to write string to DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

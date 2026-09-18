// Browser-native decoding avoids distributing an FFmpeg codec dependency.
export async function toWave(audio: Blob): Promise<Blob> {
  if (audio.type === "audio/wav") return audio;
  const decoder = new AudioContext();
  try {
    const decoded = await decoder.decodeAudioData(await audio.arrayBuffer());
    if (decoded.duration > 31) throw new Error("recording-too-long");
    const context = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * 16000),
      16000,
    );
    const source = context.createBufferSource();
    source.buffer = decoded;
    source.connect(context.destination);
    source.start();
    const samples = (await context.startRendering()).getChannelData(0),
      buffer = new ArrayBuffer(44 + samples.length * 2),
      view = new DataView(buffer);
    const text = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++)
        view.setUint8(offset + i, value.charCodeAt(i));
    };
    text(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 32000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((s, i) =>
      view.setInt16(
        44 + i * 2,
        Math.max(-1, Math.min(1, s)) * (s < 0 ? 32768 : 32767),
        true,
      ),
    );
    return new Blob([buffer], { type: "audio/wav" });
  } finally {
    await decoder.close();
  }
}

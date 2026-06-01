export function playChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const now = context.currentTime;

  const notes = [
    { frequency: 660, start: 0, duration: 0.14 },
    { frequency: 880, start: 0.16, duration: 0.22 },
  ];

  for (const note of notes) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = note.frequency;

    gain.gain.setValueAtTime(0.0001, now + note.start);
    gain.gain.exponentialRampToValueAtTime(0.18, now + note.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now + note.start);
    oscillator.stop(now + note.start + note.duration + 0.03);
  }

  window.setTimeout(() => {
    context.close();
  }, 700);
}

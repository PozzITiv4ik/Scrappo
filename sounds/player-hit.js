(() => {
  const internal = window.SCRAPPO_SOUND_INTERNAL;
  if (!internal || typeof internal.registerSound !== "function") {
    return;
  }

  internal.registerSound("player-hit", ({ context, masterGain, now }) => {
    const oscillator = context.createOscillator();
    const subOscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sawtooth";
    subOscillator.type = "triangle";

    oscillator.frequency.setValueAtTime(160, now);
    subOscillator.frequency.setValueAtTime(90, now);
    oscillator.frequency.exponentialRampToValueAtTime(70, now + 0.25);
    subOscillator.frequency.exponentialRampToValueAtTime(50, now + 0.25);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    oscillator.connect(gain);
    subOscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(now);
    subOscillator.start(now);
    oscillator.stop(now + 0.35);
    subOscillator.stop(now + 0.35);
  });
})();
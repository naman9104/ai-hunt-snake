// Simple Web Audio sound effects
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

export const sounds = {
  eat: () => {
    playTone(880, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(1100, 0.1, 'sine', 0.15), 50);
  },
  
  collision: () => {
    playTone(150, 0.3, 'sawtooth', 0.3);
    setTimeout(() => playTone(100, 0.3, 'sawtooth', 0.2), 100);
  },
  
  win: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 100);
    });
  },
  
  lose: () => {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'triangle', 0.2), i * 150);
    });
  },
  
  dash: () => {
    playTone(600, 0.08, 'square', 0.15);
    setTimeout(() => playTone(900, 0.08, 'square', 0.1), 40);
  },
  
  start: () => {
    playTone(440, 0.15, 'sine', 0.2);
    setTimeout(() => playTone(550, 0.15, 'sine', 0.2), 100);
    setTimeout(() => playTone(660, 0.2, 'sine', 0.25), 200);
  }
};

// Background music system
class BackgroundMusic {
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private volume = 0.15;

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    this.gainNode = audioContext.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
    this.gainNode.connect(audioContext.destination);

    // Create ambient drone
    const frequencies = [65.41, 98.00, 130.81]; // C2, G2, C3
    frequencies.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const oscGain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      
      // LFO for subtle movement
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.frequency.setValueAtTime(0.1 + i * 0.05, audioContext.currentTime);
      lfoGain.gain.setValueAtTime(2, audioContext.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      
      oscGain.gain.setValueAtTime(0.3 - i * 0.08, audioContext.currentTime);
      osc.connect(oscGain);
      oscGain.connect(this.gainNode!);
      osc.start();
      
      this.oscillators.push(osc, lfo);
    });
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.oscillators = [];
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  setVolume(vol: number) {
    this.volume = vol;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(vol, audioContext.currentTime);
    }
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

export const backgroundMusic = new BackgroundMusic();

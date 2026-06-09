// Adorable synth sounds generated purely with the HTML5 Web Audio API
// This avoids broken external resource files and results in cute retro arcade sounds!

class SoundManager {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Web Audio is locked or unsupported:", e);
    }
  }

  playFlip() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playCorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Sweet two-tone ding! (C5 then G5)
      const playTone = (freq: number, start: number, duration: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(523.25, now, 0.15); // C5
      playTone(783.99, now + 0.08, 0.25); // G5
    } catch (e) {}
  }

  playIncorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Funny flat slide (A3 to F3)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.25);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playComplete() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Joyous arpeggio C major: C4(261) -> E4(329) -> G4(392) -> C5(523)
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);
        
        gain.gain.setValueAtTime(0, now + index * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + index * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.3);
      });
    } catch (e) {}
  }

  // Text-To-Speech Pronunciation using standard Web Speech AI API
  speak(text: string, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) {
      console.warn("TTS is not supported in this browser.");
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // cancel current speak
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // child friendly rate

      // Attempt to pick a lovely high-quality English voice
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
      if (engVoice) {
        utterance.voice = engVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("TTS speech failed", err);
      if (onEnd) onEnd();
    }
  }
}

export const sounds = new SoundManager();

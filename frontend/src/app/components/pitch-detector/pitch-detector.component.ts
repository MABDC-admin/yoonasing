import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Mic, MicOff } from 'lucide-angular';

@Component({
  selector: 'app-pitch-detector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './pitch-detector.component.html'
})
export class PitchDetectorComponent implements OnChanges, OnDestroy {
  @Input() isPlaying = false;

  score = 0;
  isListening = false;
  finalScore: number | null = null;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private scoreAccumulator = 0;
  private samples = 0;
  private animationFrameId: number | null = null;

  readonly MicIcon = Mic;
  readonly MicOffIcon = MicOff;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isPlaying']) {
      if (this.isPlaying && !this.isListening) {
        this.startMic();
      } else if (!this.isPlaying && this.isListening) {
        this.stopMic();
      }
    }
  }

  ngOnDestroy() {
    if (this.isListening) {
      this.stopMic();
    }
  }

  private async startMic() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);
      
      this.isListening = true;
      this.finalScore = null;
      this.scoreAccumulator = 0;
      this.samples = 0;
      
      this.analyzeAudio();
    } catch (err) {
      console.error("Mic error:", err);
      // alert("Could not access microphone for scoring.");
    }
  }

  private stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isListening = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.samples > 0) {
      const averageVolume = this.scoreAccumulator / this.samples;
      let calculatedScore = Math.floor((averageVolume / 128) * 50) + 50;
      if (calculatedScore > 100) calculatedScore = 100;
      this.finalScore = calculatedScore;
    }
  }

  private analyzeAudio = () => {
    if (!this.analyser || !this.isListening) return;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    if (average > 10) {
      this.scoreAccumulator += average;
      this.samples += 1;
    }
    
    this.score = Math.min(100, Math.floor(average));

    if (this.isListening) {
      this.animationFrameId = requestAnimationFrame(this.analyzeAudio);
    }
  }
}

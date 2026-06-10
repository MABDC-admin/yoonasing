import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function PitchDetector({ isPlaying }) {
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const scoreAccumulator = useRef(0);
  const samplesRef = useRef(0);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      setIsListening(true);
      setFinalScore(null);
      scoreAccumulator.current = 0;
      samplesRef.current = 0;
      analyzeAudio();
    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone for scoring.");
    }
  };

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    
    // Calculate final score when stopped (if we were playing)
    if (samplesRef.current > 0) {
      const averageVolume = scoreAccumulator.current / samplesRef.current;
      // Map average volume (0-255) to a score of 50-100
      let calculatedScore = Math.floor((averageVolume / 128) * 50) + 50;
      if (calculatedScore > 100) calculatedScore = 100;
      setFinalScore(calculatedScore);
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !isListening) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    // Simple mock pitch/volume detection for scoring
    if (average > 10) {
      scoreAccumulator.current += average;
      samplesRef.current += 1;
    }
    
    setScore(Math.min(100, Math.floor(average)));

    if (isListening) {
      requestAnimationFrame(analyzeAudio);
    }
  };

  // Sync mic state with video playing state
  useEffect(() => {
    if (isPlaying && !isListening) {
      startMic();
    } else if (!isPlaying && isListening) {
      stopMic();
    }
    return () => {
      if (isListening) stopMic();
    }
  }, [isPlaying]);

  return (
    <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isListening ? <Mic color="var(--primary-color)" /> : <MicOff color="var(--text-muted)" />}
        <span>Live Scoring</span>
      </div>
      
      {finalScore !== null && !isPlaying ? (
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
          Score: {finalScore} / 100
        </div>
      ) : (
        <div style={{ width: '50%', height: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${score}%`, 
            background: 'var(--primary-color)',
            transition: 'width 0.1s ease-out'
          }}></div>
        </div>
      )}
    </div>
  );
}

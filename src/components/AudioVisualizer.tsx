"use client";
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  analyser, 
  isActive 
}) => {
  const visualizerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!analyser || !isActive || !visualizerRef.current) return;
    
    let animationFrameId: number;
    const visualize = () => {
      if (!isActive || !visualizerRef.current) return;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      
      const container = visualizerRef.current;
      if (!container) return;
      
      // Check if we need to create bars or update existing ones
      if (container.children.length === 0) {
        // Limit the number of bars for better visuals
        const barCount = 32;
        
        for (let i = 0; i < barCount; i++) {
          const bar = document.createElement('div');
          bar.classList.add('audio-bar');
          container.appendChild(bar);
        }
      }
      
      // Update the heights of existing bars
      const bars = container.children;
      const step = Math.floor(bufferLength / bars.length);
      
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLElement;
        const dataIndex = i * step;
        // Create smoother visualization by averaging nearby values
        let value = 0;
        const range = 2;
        for (let j = -range; j <= range; j++) {
          const index = dataIndex + j;
          if (index >= 0 && index < bufferLength) {
            value += dataArray[index];
          }
        }
        value /= (range * 2 + 1);
        
        const barHeight = (value / 255) * 100;
        bar.style.height = `${Math.max(4, barHeight)}px`;
      }
      
      animationFrameId = requestAnimationFrame(visualize);
    };
    
    visualize();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isActive]);
  
  return (
    <div 
      ref={visualizerRef} 
      className="audio-visualizer h-20 flex items-end justify-center mb-6" 
    />
  );
};

export default AudioVisualizer;
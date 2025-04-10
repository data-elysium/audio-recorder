"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Play, Square, Save } from 'lucide-react';
import { toast } from 'sonner';
import AudioVisualizer from './AudioVisualizer';
import { formatTime } from '@/utils/audioUtils';

const AudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  useEffect(() => {
    return () => {
      // Cleanup resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      
      // Reset audio URL from previous recording
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context and analyzer for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      // Add these lines to better configure the analyzer
      analyser.smoothingTimeConstant = 0.7;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      // Don't connect to destination to avoid feedback
      // source.connect(audioContext.destination);
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Reset recording time
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        toast.success('Recording saved!');
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Update recording time
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000) as unknown as number;
      
      toast.info('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not start recording. Please check your microphone permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const playAudio = () => {
    if (audioRef.current && audioURL) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Reset audio element for replay
        if (audioRef.current.srcObject) {
          audioRef.current.srcObject = null;
        }
        audioRef.current.src = audioURL;
        
        // Check if audio context exists and is in correct state
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          // Create new audio context if it doesn't exist or is closed
          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;
          
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.7;
          analyser.minDecibels = -90;
          analyser.maxDecibels = -10;
          
          analyserRef.current = analyser;
          
          // Create and store the audio source
          const source = audioContext.createMediaElementSource(audioRef.current);
          audioSourceRef.current = source;
          
          // Connect audio element to analyzer
          source.connect(analyser);
          source.connect(audioContext.destination);
        } else if (audioContextRef.current.state === 'suspended') {
          // Resume audio context if it's suspended
          audioContextRef.current.resume();
          
          // Ensure analyzer is properly connected when resuming from suspended state
          if (!analyserRef.current) {
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.7;
            analyser.minDecibels = -90;
            analyser.maxDecibels = -10;
            analyserRef.current = analyser;
            
            // Use existing source or create a new one if needed
            if (!audioSourceRef.current) {
              const source = audioContextRef.current.createMediaElementSource(audioRef.current);
              audioSourceRef.current = source;
              source.connect(analyser);
              source.connect(audioContextRef.current.destination);
            } else {
              // Reconnect existing source
              audioSourceRef.current.connect(analyser);
              audioSourceRef.current.connect(audioContextRef.current.destination);
            }
          }
        }
        
        // Ensure we have a valid analyzer node before playing
        if (!analyserRef.current && audioContextRef.current) {
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.7;
          analyser.minDecibels = -90;
          analyser.maxDecibels = -10;
          analyserRef.current = analyser;
          
          // Use existing source or create a new one if needed
          if (!audioSourceRef.current) {
            const source = audioContextRef.current.createMediaElementSource(audioRef.current);
            audioSourceRef.current = source;
            source.connect(analyser);
            source.connect(audioContextRef.current.destination);
          } else {
            // Reconnect existing source
            audioSourceRef.current.connect(analyser);
            audioSourceRef.current.connect(audioContextRef.current.destination);
          }
        } else if (analyserRef.current && audioContextRef.current) {
          // Stop any tracks if srcObject exists
          if (audioRef.current.srcObject) {
            const tracks = (audioRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
          }
          
          // Use existing source or create a new one if needed
          if (!audioSourceRef.current) {
            const source = audioContextRef.current.createMediaElementSource(audioRef.current);
            audioSourceRef.current = source;
            source.connect(analyserRef.current);
            source.connect(audioContextRef.current.destination);
          } else {
            // Ensure existing source is connected
            try {
              // Disconnect first to avoid errors from multiple connections
              audioSourceRef.current.disconnect();
            } catch (_) {
              // Ignore disconnection errors
              console.log('Error disconnecting audio source', _);
              
            }
            audioSourceRef.current.connect(analyserRef.current);
            audioSourceRef.current.connect(audioContextRef.current.destination);
          }
        }
        
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    }
  };
  
  const saveAudio = () => {
    if (!audioURL) return;
    
    const a = document.createElement('a');
    a.href = audioURL;
    a.download = `audio-recording-${new Date().toISOString().slice(0, 10)}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Downloaded recording to your device');
  };
  
  return (
    <Card className="w-full max-w-md p-6 backdrop-blur-lg bg-black/50 border-blue-900/20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Audio Recorder</h2>
        {isRecording && (
          <p className="text-red-400 animate-pulse mt-2">
            Recording... {formatTime(recordingTime)}
          </p>
        )}
      </div>
      
      <AudioVisualizer 
        analyser={analyserRef.current} 
        isActive={isRecording || isPlaying} 
        key={(isRecording || isPlaying) ? 'active' : 'idle'} 
      />
      
      <div className="flex justify-center gap-4 mb-6">
        {!isRecording ? (
          <Button 
            onClick={startRecording}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Mic className="mr-2" /> Record
          </Button>
        ) : (
          <Button 
            onClick={stopRecording} 
            variant="destructive"
            size="lg"
          >
            <Square className="mr-2" /> Stop
          </Button>
        )}
        
        {audioURL && (
          <>
            <Button 
              onClick={playAudio}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isRecording}
              size="lg"
            >
              {isPlaying ? (
                <Square className="mr-2" />
              ) : (
                <Play className="mr-2" />
              )}
              {isPlaying ? 'Stop' : 'Play'}
            </Button>
            
            <Button 
              onClick={saveAudio}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
              disabled={isRecording}
              size="lg"
            >
              <Save className="mr-2" /> Save
            </Button>
          </>
        )}
      </div>
      
      {audioURL && (
        <audio ref={audioRef} src={audioURL} className="hidden" />
      )}
    </Card>
  );
};

export default AudioRecorder;
